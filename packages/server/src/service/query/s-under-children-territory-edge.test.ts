import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the SUT:C edge ("S under T: children"):
// every Statement whose territory is the target T OR any descendant territory
// of T (recursively, to any depth) should be returned. Statements in sibling
// or unrelated territories must NOT match. It creates/drops its OWN throwaway
// db, so it never touches real data. Runs only when a RethinkDB is reachable on
// DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_s_under_children_territory_edge";
const TABLE = "entities";

// tree:
//   T0 (root)
//   ├─ T1              <- primary target
//   │   ├─ T1A
//   │   │   └─ T1AX    <- grandchild (depth check)
//   │   └─ T1B
//   └─ T2              <- sibling of T1 (its statements must NOT match T1)
const T0 = "t-0";
const T1 = "t-1";
const T1A = "t-1a";
const T1AX = "t-1ax";
const T1B = "t-1b";
const T2 = "t-2";

const territory = (id: string, parentId: string | null) => ({
  id,
  class: EntityEnums.Class.Territory,
  data: {
    parent: parentId ? { territoryId: parentId, order: 1 } : false,
  },
});

const statement = (id: string, territoryId: string) => ({
  id,
  class: EntityEnums.Class.Statement,
  data: {
    territory: { territoryId, order: 1 },
    actions: [],
    actants: [],
    tags: [],
  },
});

const FIXTURES = [
  territory(T0, null),
  territory(T1, T0),
  territory(T1A, T1),
  territory(T1AX, T1A),
  territory(T1B, T1),
  territory(T2, T0),
  statement("ST_T1", T1),
  statement("ST_T1A", T1A),
  statement("ST_T1AX", T1AX),
  statement("ST_T1B", T1B),
  statement("ST_T2", T2),
];

const runEdge = async (
  params: Query.INodeParams,
  conn: Connection
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["SUT:C"],
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

describe("SUT:C edge / S under T: children (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(TABLE).run(conn);
    // run() reads candidate statements via the territory index. prepare() resolves
    // the subtree through Territory.findChilds(deep) - treeCache is empty under
    // NODE_ENV=test, so it takes the DB fallback (a plain class+parent filter, no
    // index needed).
    await r
      .table(TABLE)
      .indexCreate(
        DbEnums.Indexes.StatementTerritory,
        r.row("data")("territory")("territoryId")
      )
      .run(conn);
    await r.table(TABLE).indexWait(DbEnums.Indexes.StatementTerritory).run(conn);
    await r.table(TABLE).insert(FIXTURES).run(conn);
  }, 30000);

  afterAll(async () => {
    if (conn) {
      await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
      await conn.close();
    }
  });

  test("returns S in the target T and all descendant territories (recursively)", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(sorted(ids)).toEqual(sorted(["ST_T1", "ST_T1A", "ST_T1AX", "ST_T1B"]));
  });

  test("statements in a sibling territory are excluded", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(ids).not.toContain("ST_T2");
  });

  test("querying an intermediate node returns only its own subtree", async () => {
    const ids = await runEdge({ entityId: T1A }, conn);
    expect(sorted(ids)).toEqual(sorted(["ST_T1A", "ST_T1AX"]));
  });

  test("a leaf territory returns only its own statements", async () => {
    const ids = await runEdge({ entityId: T1AX }, conn);
    expect(sorted(ids)).toEqual(["ST_T1AX"]);
  });

  test("only Statements are returned (territory rows excluded)", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(ids).not.toContain(T1);
    expect(ids).not.toContain(T1A);
  });

  test("no target territory -> matches nothing", async () => {
    const ids = await runEdge({}, conn);
    expect(ids).toEqual([]);
  });

  test("an unknown territory -> matches nothing", async () => {
    const ids = await runEdge({ entityId: "no-such-territory" }, conn);
    expect(ids).toEqual([]);
  });
});
