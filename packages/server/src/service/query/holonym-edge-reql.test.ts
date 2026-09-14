import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the I_R:HOL (meronyms, inverse Holonym) edge
// against a real RethinkDB. Like superclass-edge-reql.test.ts it creates/drops
// its OWN throwaway db, so it can never touch real data, and it self-skips when
// no RethinkDB is reachable on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_holonym_edge";
const ENTITIES = "entities";
const RELATIONS = "relations";

const CAR = "con-car"; // the whole
const WHEEL = "con-wheel"; // part of Car
const ENGINE = "con-engine"; // part of Car
const TREE = "con-tree"; // the whole of a different part
const LEAF = "con-leaf"; // part of Tree
const ROAD = "con-road"; // related to Wheel by a NON-holonym relation

const ENTITY_FIXTURES = [CAR, WHEEL, ENGINE, TREE, LEAF, ROAD].map((id) => ({
  id,
  class: EntityEnums.Class.Concept,
}));

// Holonym relation: entityIds = [meronym (part), holonym (whole)]
const hol = (part: string, whole: string) => ({
  id: `hol-${part}-${whole}`,
  type: RelationEnums.Type.Holonym,
  entityIds: [part, whole],
});
const RELATION_FIXTURES = [
  hol(WHEEL, CAR),
  hol(ENGINE, CAR),
  hol(LEAF, TREE),
  {
    id: "rel-road-wheel",
    type: RelationEnums.Type.Related,
    entityIds: [ROAD, WHEEL],
  },
];

const runEdge = (nodeParams: Query.INodeParams, conn: Connection): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["I_R:HOL"],
    params: {},
    logic: Query.EdgeLogic.Positive,
    id: "e1",
    node: {
      id: "n1",
      type: Query.NodeType.E,
      operator: Query.NodeOperator.And,
      params: nodeParams,
      edges: [],
    },
  });
  return edge.run(r.table(ENTITIES)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("I_R:HOL (meronyms, inverse Holonym) edge (real ReQL)", () => {
  let conn: Connection | null = null;

  beforeAll(async () => {
    try {
      conn = await r.connect({ host: HOST, port: PORT, timeout: 2 });
    } catch {
      // eslint-disable-next-line no-console
      console.warn(
        `[holonym-edge-reql] no RethinkDB on ${HOST}:${PORT} - skipping real-ReQL suite`
      );
      conn = null;
      return;
    }
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(ENTITIES).run(conn);
    await r.tableCreate(RELATIONS).run(conn);
    await r
      .table(RELATIONS)
      .indexCreate(DbEnums.Indexes.RelationsEntityIds, { multi: true })
      .run(conn);
    await r.table(RELATIONS).indexWait().run(conn);
    await r.table(ENTITIES).insert(ENTITY_FIXTURES).run(conn);
    await r.table(RELATIONS).insert(RELATION_FIXTURES).run(conn);
  }, 30000);

  afterAll(async () => {
    if (conn) {
      await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
      await conn.close();
    }
  });

  test("by entity: returns the whole Wheel is part of, not Wheel itself", async () => {
    if (!conn) return;
    expect(await runEdge({ entityId: WHEEL }, conn)).toEqual([CAR]);
  });

  test("only the Holonym relation type matches (Related is ignored)", async () => {
    if (!conn) return;
    expect(await runEdge({ entityId: ROAD }, conn)).toEqual([]);
  });

  test("no target: returns every entity that has any meronym", async () => {
    if (!conn) return;
    expect(sorted(await runEdge({}, conn))).toEqual(sorted([CAR, TREE]));
  });
});
