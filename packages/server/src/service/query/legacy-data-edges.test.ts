import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Legacy rows that lack fields newer code always writes, and props or
// classification rows added in the editor but never filled (entityId ""). Runs
// against a real RethinkDB in a throwaway db of its own, so it never touches
// the configured database.
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_legacy_data_edges";
const TABLE = "entities";

const TERRITORY = "t-legacy";
const PERSON = "p-actant";
const PERSON_EMPTY_ROWS = "p-empty-rows";
const CONCEPT = "c-type";
const RESOURCE_VALUE = "v-ref-value";

const spec = (entityId: string) => ({ entityId });
const prop = (typeId: string, valueId: string) => ({
  id: `prop-${typeId}-${valueId}`,
  type: spec(typeId),
  value: spec(valueId),
  children: [],
});
const emptyProp = prop("", "");
const emptyRow = { id: "row-empty", entityId: "" };
const actant = (entityId: string, fields: Record<string, unknown> = {}) => ({
  id: `sa-${entityId}`,
  entityId,
  props: [],
  classifications: [],
  identifications: [],
  ...fields,
});
const statement = (id: string, data: Record<string, unknown>, extra = {}) => ({
  id,
  class: EntityEnums.Class.Statement,
  props: [],
  references: [],
  ...extra,
  data: { actions: [], actants: [], tags: [], ...data },
});
const entity = (id: string, cls: EntityEnums.Class, props: unknown[] = []) => ({
  id,
  class: cls,
  props,
});

const FIXTURES = [
  entity(TERRITORY, EntityEnums.Class.Territory),
  entity(PERSON, EntityEnums.Class.Person),
  entity(PERSON_EMPTY_ROWS, EntityEnums.Class.Person),
  entity(CONCEPT, EntityEnums.Class.Concept),
  entity(RESOURCE_VALUE, EntityEnums.Class.Value),
  entity("p-filled-prop", EntityEnums.Class.Person, [prop(CONCEPT, CONCEPT)]),
  entity("p-only-empty-prop", EntityEnums.Class.Person, [emptyProp]),
  // an action prop whose type lacks entityId, next to an actant prop that matches
  statement("S-prop-missing-id", {
    territory: { territoryId: TERRITORY },
    actions: [
      { actionId: "a1", props: [{ id: "bad", type: {}, value: spec(""), children: [] }] },
    ],
    actants: [actant(PERSON, { props: [prop(CONCEPT, "")] })],
  }),
  // a reference without a resource, and a territory without territoryId
  statement(
    "S-ref-missing-resource",
    { territory: { order: 1 }, actants: [actant(PERSON)] },
    { references: [{ id: "r1", value: RESOURCE_VALUE }] }
  ),
  // nothing but rows nobody filled in
  statement("S-only-empty-rows", {
    territory: { territoryId: TERRITORY },
    actions: [{ actionId: "a1", props: [emptyProp] }],
    actants: [
      actant(PERSON_EMPTY_ROWS, {
        props: [emptyProp],
        classifications: [emptyRow],
        identifications: [emptyRow],
      }),
    ],
  }),
];

const runEdge = (
  type: Query.EdgeType,
  targetEntityId: string,
  conn: Connection,
  entityClasses?: EntityEnums.Class[]
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type,
    params: {},
    logic: Query.EdgeLogic.Positive,
    id: "e1",
    node: {
      id: "n1",
      type: Query.NodeType.E,
      operator: Query.NodeOperator.And,
      params: { entityId: targetEntityId, entityClasses },
      edges: [],
    },
  });
  return edge.run(r.table(TABLE)).distinct().run(conn) as Promise<string[]>;
};

describe("query edges over legacy and unfilled data (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(TABLE).run(conn);
    await r
      .table(TABLE)
      .indexCreate(DbEnums.Indexes.StatementTerritory, r.row("data")("territory")("territoryId"))
      .run(conn);
    // unconstrained targets read every entity of a class through this index
    await r.table(TABLE).indexCreate("class").run(conn);
    await r.table(TABLE).indexWait().run(conn);
    await r.table(TABLE).insert(FIXTURES).run(conn);
  }, 30000);

  afterAll(async () => {
    if (conn) {
      await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
      await conn.close();
    }
  });

  test("EUT reads a territory whose statement has a prop without entityId", async () => {
    const ids = await runEdge(Query.EdgeType["EUT:"], TERRITORY, conn);
    expect(ids).toContain(PERSON);
  });

  test("EUT without a target reads every legacy statement", async () => {
    const ids = await runEdge(Query.EdgeType["EUT:"], "", conn);
    expect(ids).toContain(RESOURCE_VALUE);
  });

  test("IS reads a statement whose reference has no resource", async () => {
    const ids = await runEdge(Query.EdgeType["IS:"], "S-ref-missing-resource", conn);
    expect(ids).toEqual(expect.arrayContaining([PERSON, RESOURCE_VALUE]));
  });

  test("T has S without a target skips a territory without territoryId", async () => {
    const ids = await runEdge(Query.EdgeType["I_SUT:"], "", conn);
    expect(ids).toEqual([TERRITORY]);
  });

  test("SP:T finds a statement next to a prop without entityId", async () => {
    const ids = await runEdge(Query.EdgeType["SP:T"], CONCEPT, conn);
    expect(ids).toEqual(["S-prop-missing-id"]);
  });

  test("SP:T without a target skips statements with only empty props", async () => {
    const ids = await runEdge(Query.EdgeType["SP:T"], "", conn);
    expect(ids).toContain("S-prop-missing-id");
    expect(ids).not.toContain("S-only-empty-rows");
  });

  test("S has entity with a class reads statements with a broken territory", async () => {
    const ids = await runEdge(Query.EdgeType["I_IS:"], "", conn, [EntityEnums.Class.Person]);
    expect(ids).toEqual(
      expect.arrayContaining(["S-prop-missing-id", "S-ref-missing-resource"])
    );
  });

  test("EP:T and HP:V without a target skip entities with only empty props", async () => {
    for (const type of [Query.EdgeType["EP:T"], Query.EdgeType["HP:V"]]) {
      const ids = await runEdge(type, "", conn);
      expect(ids).toContain("p-filled-prop");
      expect(ids).not.toContain("p-only-empty-prop");
    }
  });

  test("I_SC and I_SI without a target skip actants with only empty rows", async () => {
    for (const type of [Query.EdgeType["I_SC"], Query.EdgeType["I_SI"]]) {
      const ids = await runEdge(type, "", conn);
      expect(ids).not.toContain(PERSON_EMPTY_ROWS);
    }
  });
});
