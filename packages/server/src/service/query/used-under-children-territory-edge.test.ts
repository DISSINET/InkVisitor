import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the EUT:C edge ("used in statements under T:
// children"): every entity USED in a statement under the target Territory OR
// any descendant territory (recursively, to any depth) should be returned -
// the same broad "used" set as EUT: (actants, actions, tags, props, references,
// classifications/identifications), but over the whole subtree instead of the
// direct territory only. It creates/drops its OWN throwaway db, so it never
// touches real data. Runs only when a RethinkDB is reachable on
// DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_used_under_children_territory_edge";
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

const actant = (entityId: string, position: EntityEnums.Position) => ({
  id: `sa-${entityId}`,
  entityId,
  position,
  props: [],
  classifications: [],
  identifications: [],
});

const entity = (id: string, cls: EntityEnums.Class = EntityEnums.Class.Concept) => ({
  id,
  class: cls,
});

const statement = (id: string, territoryId: string, actants: any[] = []) => ({
  id,
  class: EntityEnums.Class.Statement,
  props: [],
  references: [],
  data: {
    territory: { territoryId, order: 1 },
    actions: [],
    actants,
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
  entity("USED_T1"), //   used directly under T1
  entity("USED_T1A"), //  used under child T1A
  entity("USED_T1AX"), // used under grandchild T1AX
  entity("USED_T1B"), //  used under child T1B
  entity("USED_T2"), //   used only under the sibling T2
  entity("LONELY"), //    exists but used in no statement
  statement("ST_T1", T1, [actant("USED_T1", EntityEnums.Position.Subject)]),
  statement("ST_T1A", T1A, [actant("USED_T1A", EntityEnums.Position.Subject)]),
  statement("ST_T1AX", T1AX, [actant("USED_T1AX", EntityEnums.Position.Subject)]),
  statement("ST_T1B", T1B, [actant("USED_T1B", EntityEnums.Position.Subject)]),
  statement("ST_T2", T2, [actant("USED_T2", EntityEnums.Position.Subject)]),
];

const runEdge = async (
  params: Query.INodeParams,
  conn: Connection
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["EUT:C"],
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

describe("EUT:C edge / used in statements under T: children (real ReQL)", () => {
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

  test("returns entities used in the target T and all descendant territories", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(sorted(ids)).toEqual(
      sorted(["USED_T1", "USED_T1A", "USED_T1AX", "USED_T1B"])
    );
  });

  test("entities used only under a sibling territory are excluded", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(ids).not.toContain("USED_T2");
    expect(ids).not.toContain("LONELY");
  });

  test("querying an intermediate node returns only its own subtree's usage", async () => {
    const ids = await runEdge({ entityId: T1A }, conn);
    expect(sorted(ids)).toEqual(sorted(["USED_T1A", "USED_T1AX"]));
  });

  test("a leaf territory returns only entities used in its own statements", async () => {
    const ids = await runEdge({ entityId: T1AX }, conn);
    expect(sorted(ids)).toEqual(["USED_T1AX"]);
  });

  test("neither statements nor territories are returned as 'used'", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(ids).not.toContain("ST_T1");
    expect(ids).not.toContain("ST_T1A");
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
