import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the R:SOE (SuperordinateEntity) edge against a
// real RethinkDB. Like inverse-statement-prop.test.ts it creates/drops its OWN
// throwaway db, so it can never touch real data, and it self-skips when no
// RethinkDB is reachable on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_superordinate_edge";
const ENTITIES = "entities";
const RELATIONS = "relations";

// --- location ids ---
const LOMBARDY = "loc-lombardy"; // the superordinate we search by
const LAZIO = "loc-lazio"; // a different superordinate
const MILAN = "loc-milan"; // subordinate to Lombardy
const BERGAMO = "loc-bergamo"; // subordinate to Lombardy
const ROME = "loc-rome"; // subordinate to Lazio
const PARIS = "loc-paris"; // related to Lombardy by a NON-superordinate relation

const entity = (id: string, cls = EntityEnums.Class.Location) => ({
  id,
  class: cls,
});
const ENTITY_FIXTURES = [LOMBARDY, LAZIO, MILAN, BERGAMO, ROME, PARIS].map((id) =>
  entity(id)
);

// SuperordinateEntity relation: entityIds = [subordinate, superordinate]
const soe = (subordinate: string, superordinate: string) => ({
  id: `soe-${subordinate}-${superordinate}`,
  type: RelationEnums.Type.SuperordinateEntity,
  entityIds: [subordinate, superordinate],
});
const RELATION_FIXTURES = [
  soe(MILAN, LOMBARDY),
  soe(BERGAMO, LOMBARDY),
  soe(ROME, LAZIO),
  // a non-superordinate relation between PARIS and LOMBARDY - must be ignored
  {
    id: "rel-paris-lombardy",
    type: RelationEnums.Type.Related,
    entityIds: [PARIS, LOMBARDY],
  },
];

const runEdge = (
  targetEntityId: string | undefined,
  conn: Connection
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["R:SOE"],
    params: {},
    logic: Query.EdgeLogic.Positive,
    id: "e1",
    node: {
      id: "n1",
      type: Query.NodeType.E,
      operator: Query.NodeOperator.And,
      params: targetEntityId ? { entityId: targetEntityId } : {},
      edges: [],
    },
  });
  return edge.run(r.table(ENTITIES)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("R:SOE (SuperordinateEntity) edge (real ReQL)", () => {
  let conn: Connection | null = null;

  beforeAll(async () => {
    try {
      conn = await r.connect({ host: HOST, port: PORT, timeout: 2 });
    } catch {
      // eslint-disable-next-line no-console
      console.warn(
        `[superordinate-edge-reql] no RethinkDB on ${HOST}:${PORT} - skipping real-ReQL suite`
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

  test("by entity: returns the subordinates of Lombardy, not Lombardy itself", async () => {
    if (!conn) return;
    const ids = await runEdge(LOMBARDY, conn);
    expect(sorted(ids)).toEqual(sorted([MILAN, BERGAMO]));
    expect(ids).not.toContain(LOMBARDY);
    expect(ids).not.toContain(ROME);
  });

  test("only the SuperordinateEntity relation type matches (Related is ignored)", async () => {
    if (!conn) return;
    const ids = await runEdge(LOMBARDY, conn);
    expect(ids).not.toContain(PARIS);
  });

  test("no target: returns every entity that has any superordinate", async () => {
    if (!conn) return;
    const ids = await runEdge(undefined, conn);
    expect(sorted(ids)).toEqual(sorted([MILAN, BERGAMO, ROME]));
  });
});
