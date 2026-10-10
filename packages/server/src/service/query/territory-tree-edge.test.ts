import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IResponseTree } from "@inkvisitor/shared/types";
import { Query } from "@inkvisitor/shared/types/query";
import treeCache from "@service/treeCache";
import { getEdgeInstance } from "./edge";

// Verifies the territory-tree edges (CT: / CT:D / I_CT:) against the ACTUAL
// ReQL, for a pinned target, an unpinned target narrowed by status, and an
// unconstrained target, which means "any territory". It
// creates/drops its OWN throwaway db, so it never touches real data. Runs only
// when a RethinkDB is reachable on DB_HOST/DB_PORT (defaults localhost:28015).
//
// treeCache is empty under NODE_ENV=test, so the tree is stubbed into its
// idMap: CT: / CT:D read ancestor paths from it and getSubordinateEntityIds
// (I_CT: with SUB on) walks its children.
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_territory_tree_edge";
const ENTITIES = "entities";
const RELATIONS = "relations";

//   ROOT
//   ├── T_A             <- identified (IDE) with T_B1
//   └── T_B
//       └── T_B1        <- the only Discouraged territory
//           └── T_B1A
//               └── T_B1A1
const ROOT = "t-root";
const T_A = "t-a";
const T_B = "t-b";
const T_B1 = "t-b1";
const T_B1A = "t-b1a";
const T_B1A1 = "t-b1a1";

const TREE: [id: string, parentId: string | null, path: string[]][] = [
  [ROOT, null, []],
  [T_A, ROOT, [ROOT]],
  [T_B, ROOT, [ROOT]],
  [T_B1, T_B, [ROOT, T_B]],
  [T_B1A, T_B1, [ROOT, T_B, T_B1]],
  [T_B1A1, T_B1A, [ROOT, T_B, T_B1, T_B1A]],
];

const ENTITY_FIXTURES = TREE.map(([id, parentId]) => ({
  id,
  class: EntityEnums.Class.Territory,
  status:
    id === T_B1 ? EntityEnums.Status.Discouraged : EntityEnums.Status.Approved,
  labels: [],
  data: {
    parent: parentId ? { territoryId: parentId, order: 1 } : false,
  },
}));

const RELATION_FIXTURES = [
  { id: "ide-a-b1", type: RelationEnums.Type.Identification, entityIds: [T_A, T_B1] },
];

const DISCOURAGED: Query.INodeParams = {
  entityStatuses: [EntityEnums.Status.Discouraged],
};

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
  return edge.run(r.table(ENTITIES)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("territory-tree edges (real ReQL)", () => {
  let conn: Connection;
  const originalIdMap = treeCache.tree.idMap;

  beforeAll(async () => {
    const idMap: Record<string, IResponseTree> = {};
    for (const [id, parentId, path] of TREE) {
      idMap[id] = {
        territory: { id },
        path,
        children: [],
      } as unknown as IResponseTree;
      if (parentId) {
        idMap[parentId].children.push(idMap[id]);
      }
    }
    treeCache.tree.idMap = idMap;

    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(ENTITIES).run(conn);
    await r.tableCreate(RELATIONS).run(conn);
    // an unpinned status-constrained target is resolved through the class
    // index (mirrors indexes.ts)
    await r.table(ENTITIES).indexCreate(DbEnums.Indexes.Class).run(conn);
    await r.table(ENTITIES).indexWait(DbEnums.Indexes.Class).run(conn);
    // EQ reads Identification relations through this multi index (mirrors
    // indexes.ts)
    await r
      .table(RELATIONS)
      .indexCreate(DbEnums.Indexes.RelationsEntityIds, { multi: true })
      .run(conn);
    await r.table(RELATIONS).indexWait().run(conn);
    await r.table(ENTITIES).insert(ENTITY_FIXTURES).run(conn);
    await r.table(RELATIONS).insert(RELATION_FIXTURES).run(conn);
  }, 30000);

  afterAll(async () => {
    treeCache.tree.idMap = originalIdMap;
    if (conn) {
      await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
      await conn.close();
    }
  });

  describe("CT: / CT:D (T has child T)", () => {
    test("CT: with a pinned target matches all its ancestors", async () => {
      const ids = await runEdge(Query.EdgeType["CT:"], { entityId: T_B1 }, conn);
      expect(sorted(ids)).toEqual(sorted([ROOT, T_B]));
    });

    test("CT: ignores the SUB toggle on a pinned target", async () => {
      const ids = await runEdge(
        Query.EdgeType["CT:"],
        { entityId: T_B1, includeSubordinates: true },
        conn
      );
      expect(sorted(ids)).toEqual(sorted([ROOT, T_B]));
    });

    test("CT: with EQ also climbs from the territories identified with the target", async () => {
      const ids = await runEdge(
        Query.EdgeType["CT:"],
        { entityId: T_A, includeEquivalents: true },
        conn
      );
      expect(sorted(ids)).toEqual(sorted([ROOT, T_B]));
    });

    test("CT: with an unpinned status target matches that territory's ancestors", async () => {
      const ids = await runEdge(Query.EdgeType["CT:"], DISCOURAGED, conn);
      expect(sorted(ids)).toEqual(sorted([ROOT, T_B]));
    });

    test("CT:D with an unpinned status target matches the direct parent only", async () => {
      const ids = await runEdge(Query.EdgeType["CT:D"], DISCOURAGED, conn);
      expect(ids).toEqual([T_B]);
    });

    test("an unconstrained target matches every territory with a child", async () => {
      const ids = await runEdge(Query.EdgeType["CT:"], {}, conn);
      expect(sorted(ids)).toEqual(sorted([ROOT, T_B, T_B1, T_B1A]));
    });

    test("CT:D with an unconstrained target matches the same territories", async () => {
      const ids = await runEdge(Query.EdgeType["CT:D"], {}, conn);
      expect(sorted(ids)).toEqual(sorted([ROOT, T_B, T_B1, T_B1A]));
    });
  });

  describe("I_CT: (T has parent T)", () => {
    test("pinned target, SUB off: direct children only", async () => {
      const ids = await runEdge(Query.EdgeType["I_CT:"], { entityId: T_B }, conn);
      expect(ids).toEqual([T_B1]);
    });

    test("pinned target, SUB on: whole subtree", async () => {
      const ids = await runEdge(
        Query.EdgeType["I_CT:"],
        { entityId: T_B, includeSubordinates: true },
        conn
      );
      expect(sorted(ids)).toEqual(sorted([T_B1, T_B1A, T_B1A1]));
    });

    test("pinned target with EQ: also the children of territories identified with it", async () => {
      const ids = await runEdge(
        Query.EdgeType["I_CT:"],
        { entityId: T_A, includeEquivalents: true },
        conn
      );
      expect(ids).toEqual([T_B1A]);
    });

    test("pinned target with EQ and SUB: also the subtrees of identified territories", async () => {
      const ids = await runEdge(
        Query.EdgeType["I_CT:"],
        { entityId: T_A, includeEquivalents: true, includeSubordinates: true },
        conn
      );
      expect(sorted(ids)).toEqual(sorted([T_B1A, T_B1A1]));
    });

    test("unpinned status target, SUB off: that territory's direct children", async () => {
      const ids = await runEdge(Query.EdgeType["I_CT:"], DISCOURAGED, conn);
      expect(ids).toEqual([T_B1A]);
    });

    test("unpinned status target ignores SUB: direct children only", async () => {
      const ids = await runEdge(
        Query.EdgeType["I_CT:"],
        { ...DISCOURAGED, includeSubordinates: true },
        conn
      );
      expect(ids).toEqual([T_B1A]);
    });

    test("an unconstrained target matches every territory with a parent", async () => {
      const ids = await runEdge(Query.EdgeType["I_CT:"], {}, conn);
      expect(sorted(ids)).toEqual(sorted([T_A, T_B, T_B1, T_B1A, T_B1A1]));
    });
  });
});
