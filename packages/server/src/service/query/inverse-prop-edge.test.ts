import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the inverse entity-prop edges (I_EP:T / I_HP:V) against the ACTUAL
// ReQL: given an origin entity, they match the prop types / values in its own
// props. It creates/drops its OWN throwaway db, so it never touches real data.
// Runs only when a RethinkDB is reachable on DB_HOST/DB_PORT (defaults
// localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_inverse_prop_edge";
const TABLE = "entities";

const PERSON = "p-origin";
const GROUP = "g-origin";
const C_OCCUPATION = "c-occupation";
const C_BLACKSMITH = "c-blacksmith";
const C_MEMBERS = "c-members";
const C_MANY = "c-many";
const C_CHILD_TYPE = "c-child-type";
const C_CHILD_VALUE = "c-child-value";
const C_UNUSED = "c-unused";

const prop = (typeId: string, valueId: string, children: any[] = []) => ({
  id: `${typeId}-${valueId}`,
  type: { entityId: typeId },
  value: { entityId: valueId },
  children,
});
const concept = (id: string) => ({ id, class: EntityEnums.Class.Concept, props: [] });

const FIXTURES = [
  {
    id: PERSON,
    class: EntityEnums.Class.Person,
    props: [
      // a child prop is not one of the origin's own top-level props
      prop(C_OCCUPATION, C_BLACKSMITH, [prop(C_CHILD_TYPE, C_CHILD_VALUE)]),
      // a type picked with no value yet
      prop(C_OCCUPATION, ""),
    ],
  },
  { id: GROUP, class: EntityEnums.Class.Group, props: [prop(C_MEMBERS, C_MANY)] },
  concept(C_OCCUPATION),
  concept(C_BLACKSMITH),
  concept(C_MEMBERS),
  concept(C_MANY),
  concept(C_CHILD_TYPE),
  concept(C_CHILD_VALUE),
  concept(C_UNUSED),
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

describe("inverse entity-prop edges (real ReQL)", () => {
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

  test("I_HP:V with a pinned origin matches the values of its own props", async () => {
    const ids = await runEdge(Query.EdgeType["I_HP:V"], { entityId: PERSON }, conn);
    expect(ids).toEqual([C_BLACKSMITH]);
  });

  test("I_EP:T with a pinned origin matches the types of its own props", async () => {
    const ids = await runEdge(Query.EdgeType["I_EP:T"], { entityId: PERSON }, conn);
    expect(ids).toEqual([C_OCCUPATION]);
  });

  test("I_HP:V with an empty target matches the values of any entity's props", async () => {
    const ids = await runEdge(Query.EdgeType["I_HP:V"], {}, conn);
    expect(sorted(ids)).toEqual(sorted([C_BLACKSMITH, C_MANY]));
  });

  test("I_EP:T with an empty target narrows the origins by the target node's class", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_EP:T"],
      { entityClasses: [EntityEnums.Class.Group] },
      conn
    );
    expect(ids).toEqual([C_MEMBERS]);
  });

  test("an origin without props matches nothing", async () => {
    const ids = await runEdge(Query.EdgeType["I_HP:V"], { entityId: C_UNUSED }, conn);
    expect(ids).toEqual([]);
  });
});
