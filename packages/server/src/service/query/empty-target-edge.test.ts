import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies against the ACTUAL ReQL that an edge target left empty - no pinned
// entity, no status - means "any" for the edges that otherwise look their
// target ids up (SUT: / I_SUT: / IS:S / IS:A / I_HR:R), and that a class
// picked on that empty target narrows it (I_HR:R / HP:V / SP:V / I_SP:V /
// I_IS:). The territory-tree, EUT:, IS: and I_IS: edges cover the plain
// empty target in their own test files. It creates/drops its OWN throwaway
// db, so it never touches real data. Runs only when a RethinkDB is reachable
// on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_empty_target_edge";
const TABLE = "entities";

const T1 = "t-1";
const T_EMPTY = "t-empty"; // holds no statement
const S1 = "s-1";
const S2 = "s-2";
const SUBJECT = "p-subject";
const ACTANT1 = "p-actant1";
const ACTION = "a-action";
const RES_BY_STATEMENT = "r-by-statement";
const RES_BY_PERSON = "r-by-person";
const RES_UNUSED = "r-unused";
const PERSON_WITH_REF = "p-with-ref";
const PERSON_WITH_PROPS = "p-with-props";
const C_PROP_TYPE = "c-prop-type";

const prop = (typeId: string, valueId: string) => ({
  type: { entityId: typeId },
  value: { entityId: valueId },
  children: [],
});

const resource = (id: string) => ({
  id,
  class: EntityEnums.Class.Resource,
  references: [],
  props: [],
});
const person = (id: string, references: any[] = [], props: any[] = []) => ({
  id,
  class: EntityEnums.Class.Person,
  references,
  props,
});
const statement = (id: string, opts: any = {}) => ({
  id,
  class: EntityEnums.Class.Statement,
  references: opts.references ?? [],
  data: {
    territory: { territoryId: T1, order: 1 },
    actions: opts.actions ?? [],
    actants: opts.actants ?? [],
    tags: [],
  },
});

const FIXTURES = [
  { id: T1, class: EntityEnums.Class.Territory, references: "", data: { parent: false } },
  {
    id: T_EMPTY,
    class: EntityEnums.Class.Territory,
    references: [],
    data: { parent: { territoryId: T1, order: 1 } },
  },
  statement(S1, {
    actants: [
      {
        entityId: SUBJECT,
        position: EntityEnums.Position.Subject,
        // the only in-statement prop: its value is a Person
        props: [prop(C_PROP_TYPE, PERSON_WITH_REF)],
      },
      { entityId: ACTANT1, position: EntityEnums.Position.Actant1, props: [] },
    ],
    actions: [{ actionId: ACTION, props: [] }],
    // a value-only reference carries no resource and must be skipped
    references: [{ resource: RES_BY_STATEMENT, value: "" }, { resource: "", value: "v" }],
  }),
  statement(S2),
  person(SUBJECT),
  person(ACTANT1),
  person(PERSON_WITH_REF, [{ resource: RES_BY_PERSON, value: "" }]),
  // own props: one value is an Action, the other a Resource
  person(PERSON_WITH_PROPS, [], [prop(C_PROP_TYPE, ACTION), prop(C_PROP_TYPE, RES_UNUSED)]),
  { id: ACTION, class: EntityEnums.Class.Action, references: [], props: [] },
  { id: C_PROP_TYPE, class: EntityEnums.Class.Concept, references: [], props: [] },
  resource(RES_BY_STATEMENT),
  resource(RES_BY_PERSON),
  resource(RES_UNUSED),
];

const runEdge = async (
  edgeType: Query.EdgeType,
  params: Query.INodeParams,
  conn: Connection
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: edgeType,
    params: {},
    logic: Query.EdgeLogic.Positive,
    id: "e1",
    node: {
      id: "n1",
      type: Query.NodeType.E,
      operator: Query.NodeOperator.And,
      params,
      edges: [],
    },
  });
  await edge.prepare(conn);
  return edge.run(r.table(TABLE)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("edges with an empty target match any (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(TABLE).run(conn);
    await r.table(TABLE).insert(FIXTURES).run(conn);
  }, 30000);

  afterAll(async () => {
    if (conn) {
      await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
      await conn.close();
    }
  });

  test("SUT: matches every statement under a territory", async () => {
    const ids = await runEdge(Query.EdgeType["SUT:"], {}, conn);
    expect(sorted(ids)).toEqual(sorted([S1, S2]));
  });

  test("I_SUT: matches territories that directly hold a statement", async () => {
    const ids = await runEdge(Query.EdgeType["I_SUT:"], {}, conn);
    expect(ids).toEqual([T1]);
  });

  test("IS:S matches the subject of any statement", async () => {
    const ids = await runEdge(Query.EdgeType["IS:S"], {}, conn);
    expect(ids).toEqual([SUBJECT]);
  });

  test("IS:A matches the action of any statement", async () => {
    const ids = await runEdge(Query.EdgeType["IS:A"], {}, conn);
    expect(ids).toEqual([ACTION]);
  });

  test("I_HR:R matches resources referenced by any entity", async () => {
    const ids = await runEdge(Query.EdgeType["I_HR:R"], {}, conn);
    expect(sorted(ids)).toEqual(sorted([RES_BY_STATEMENT, RES_BY_PERSON]));
  });

  test("I_HR:R narrows the referencing entities by the target node's class", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_HR:R"],
      { entityClasses: [EntityEnums.Class.Person] },
      conn
    );
    expect(ids).toEqual([RES_BY_PERSON]);
  });

  test("HP:V narrows the prop values by the target node's class", async () => {
    const byClass = (cls: EntityEnums.Class) =>
      runEdge(Query.EdgeType["HP:V"], { entityClasses: [cls] }, conn);
    expect(await byClass(EntityEnums.Class.Action)).toEqual([PERSON_WITH_PROPS]);
    expect(await byClass(EntityEnums.Class.Group)).toEqual([]);
  });

  test("SP:V narrows the in-statement prop values by the target node's class", async () => {
    const byClass = (cls: EntityEnums.Class) =>
      runEdge(Query.EdgeType["SP:V"], { entityClasses: [cls] }, conn);
    expect(await byClass(EntityEnums.Class.Person)).toEqual([S1]);
    expect(await byClass(EntityEnums.Class.Resource)).toEqual([]);
  });

  test("I_SP:V narrows the in-statement prop values by the target node's class", async () => {
    const byClass = (cls: EntityEnums.Class) =>
      runEdge(Query.EdgeType["I_SP:V"], { entityClasses: [cls] }, conn);
    expect(await byClass(EntityEnums.Class.Person)).toEqual([SUBJECT]);
    expect(await byClass(EntityEnums.Class.Resource)).toEqual([]);
  });

  test("I_IS: narrows to statements referencing an entity of the target node's class", async () => {
    const byClass = (cls: EntityEnums.Class) =>
      runEdge(Query.EdgeType["I_IS:"], { entityClasses: [cls] }, conn);
    expect(await byClass(EntityEnums.Class.Action)).toEqual([S1]);
    expect(sorted(await byClass(EntityEnums.Class.Territory))).toEqual(sorted([S1, S2]));
    expect(await byClass(EntityEnums.Class.Group)).toEqual([]);
  });

  test("a status no entity carries still matches nothing", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_HR:R"],
      { entityStatuses: [EntityEnums.Status.Discouraged] },
      conn
    );
    expect(ids).toEqual([]);
  });
});
