import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the relation edges against a real RethinkDB:
// R:SOE (its own named class) plus the edges sharing the two generic runners -
// ordered (R:HOL, R:IMP) and direction-less (R:ANT, R:SYN, R:PRR, R:IDE).
// Like inverse-statement-prop.test.ts it creates/drops its OWN throwaway db, so
// it can never touch real data, and it self-skips when no RethinkDB is reachable
// on DB_HOST/DB_PORT (defaults localhost:28015).
//
// All of it shares ONE throwaway db: every db create/drop is cluster-wide
// metadata churn, and the suites run in parallel workers against the same
// RethinkDB, so an extra db-creating suite destabilises the others.
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_relation_edge";
const ENTITIES = "entities";
const RELATIONS = "relations";

// --- location ids ---
const LOMBARDY = "loc-lombardy"; // the superordinate we search by
const LAZIO = "loc-lazio"; // a different superordinate
const MILAN = "loc-milan"; // subordinate to Lombardy
const BERGAMO = "loc-bergamo"; // subordinate to Lombardy
const ROME = "loc-rome"; // subordinate to Lazio
const PARIS = "loc-paris"; // related to Lombardy by a NON-superordinate relation
const FOUNDING = "evt-founding"; // an EVENT superordinate (class-filter fixture)
const TURIN = "loc-turin"; // subordinate to the FOUNDING event
const NAPLES = "loc-naples"; // subordinate to a MISSING (dangling) superordinate

// --- concepts, for the generic relation runners ---
const HOT = "con-hot"; // antonym of COLD, synonym of WARM/BOILING
const COLD = "con-cold";
const WARM = "con-warm";
const BOILING = "con-boiling";
const LONELY = "con-lonely"; // its own property reciprocal (self loop)
const ORPHAN = "con-orphan"; // antonym of a MISSING (dangling) entity
// --- other classes ---
const RUNNING = "act-running"; // implies WALKING
const WALKING = "act-walking";
const CAESAR = "per-caesar"; // identified with AUGUSTUS
const AUGUSTUS = "per-augustus";

const entity = (id: string, cls = EntityEnums.Class.Location) => ({
  id,
  class: cls,
});
const ENTITY_FIXTURES = [
  ...[LOMBARDY, LAZIO, MILAN, BERGAMO, ROME, PARIS, TURIN, NAPLES].map((id) =>
    entity(id)
  ),
  entity(FOUNDING, EntityEnums.Class.Event),
  ...[HOT, COLD, WARM, BOILING, LONELY, ORPHAN].map((id) =>
    entity(id, EntityEnums.Class.Concept)
  ),
  entity(RUNNING, EntityEnums.Class.Action),
  entity(WALKING, EntityEnums.Class.Action),
  entity(CAESAR, EntityEnums.Class.Person),
  entity(AUGUSTUS, EntityEnums.Class.Person),
];

const relation = (
  id: string,
  type: RelationEnums.Type,
  entityIds: string[]
) => ({ id, type, entityIds });

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
  soe(TURIN, FOUNDING),
  // dangling superordinate: entity row does not exist
  soe(NAPLES, "missing-superordinate"),
  // a non-superordinate relation between PARIS and LOMBARDY - must be ignored
  {
    id: "rel-paris-lombardy",
    type: RelationEnums.Type.Related,
    entityIds: [PARIS, LOMBARDY],
  },
  relation("ant-hot-cold", RelationEnums.Type.Antonym, [HOT, COLD]),
  relation("ant-orphan", RelationEnums.Type.Antonym, [ORPHAN, "missing-entity"]),
  // a cloud: every member is a synonym of every other member
  relation("syn-heat", RelationEnums.Type.Synonym, [HOT, WARM, BOILING]),
  // selfLoop: the same id in both slots
  relation("prr-lonely", RelationEnums.Type.PropertyReciprocal, [
    LONELY,
    LONELY,
  ]),
  relation("prr-hot-warm", RelationEnums.Type.PropertyReciprocal, [HOT, WARM]),
  relation("ide-caesar", RelationEnums.Type.Identification, [CAESAR, AUGUSTUS]),
  // ordered: entityIds[0] holds the holonym/implication of entityIds[1]
  relation("hol-hot-boiling", RelationEnums.Type.Holonym, [BOILING, HOT]),
  relation("imp-running", RelationEnums.Type.Implication, [RUNNING, WALKING]),
  // a non-Antonym relation between HOT and RUNNING - the R:ANT edge must ignore it
  relation("rel-hot-running", RelationEnums.Type.Related, [HOT, RUNNING]),
];

const runEdge = (
  type: Query.EdgeType,
  nodeParams: Query.INodeParams,
  conn: Connection
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
      params: nodeParams,
      edges: [],
    },
  });
  return edge.run(r.table(ENTITIES)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("relation edges (real ReQL)", () => {
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
    const ids = await runEdge(Query.EdgeType["R:SOE"], { entityId: LOMBARDY }, conn);
    expect(sorted(ids)).toEqual(sorted([MILAN, BERGAMO]));
    expect(ids).not.toContain(LOMBARDY);
    expect(ids).not.toContain(ROME);
  });

  test("only the SuperordinateEntity relation type matches (Related is ignored)", async () => {
    if (!conn) return;
    const ids = await runEdge(Query.EdgeType["R:SOE"], { entityId: LOMBARDY }, conn);
    expect(ids).not.toContain(PARIS);
  });

  test("no target: returns every entity that has any superordinate", async () => {
    if (!conn) return;
    const ids = await runEdge(Query.EdgeType["R:SOE"], {}, conn);
    expect(sorted(ids)).toEqual(sorted([MILAN, BERGAMO, ROME, TURIN, NAPLES]));
  });

  test("by class: Location superordinates only (Event-superordinated and dangling excluded)", async () => {
    if (!conn) return;
    const ids = await runEdge(
      Query.EdgeType["R:SOE"],
      { entityClasses: [EntityEnums.Class.Location] },
      conn
    );
    expect(sorted(ids)).toEqual(sorted([MILAN, BERGAMO, ROME]));
    expect(ids).not.toContain(TURIN); // superordinate is an Event
    expect(ids).not.toContain(NAPLES); // dangling superordinate fails the class check
  });

  test("by class: Event superordinates only", async () => {
    if (!conn) return;
    const ids = await runEdge(
      Query.EdgeType["R:SOE"],
      { entityClasses: [EntityEnums.Class.Event] },
      conn
    );
    expect(sorted(ids)).toEqual(sorted([TURIN]));
  });

  test("entityId wins over entityClasses when both are set", async () => {
    if (!conn) return;
    const ids = await runEdge(
      Query.EdgeType["R:SOE"],
      { entityId: LOMBARDY, entityClasses: [EntityEnums.Class.Event] },
      conn
    );
    expect(sorted(ids)).toEqual(sorted([MILAN, BERGAMO]));
  });

  test("R:ANT matches from either side of the pair", async () => {
    if (!conn) return;
    expect(
      await runEdge(Query.EdgeType["R:ANT"], { entityId: COLD }, conn)
    ).toEqual([HOT]);
    expect(
      await runEdge(Query.EdgeType["R:ANT"], { entityId: HOT }, conn)
    ).toEqual([COLD]);
  });

  test("R:ANT ignores relations of another type", async () => {
    if (!conn) return;
    const ids = await runEdge(
      Query.EdgeType["R:ANT"],
      { entityId: RUNNING },
      conn
    );
    expect(ids).toEqual([]);
  });

  test("R:ANT with no target returns every entity that has an antonym", async () => {
    if (!conn) return;
    const ids = await runEdge(Query.EdgeType["R:ANT"], {}, conn);
    expect(sorted(ids)).toEqual(sorted([HOT, COLD, ORPHAN]));
  });

  test("R:ANT by class excludes the dangling partner", async () => {
    if (!conn) return;
    const ids = await runEdge(
      Query.EdgeType["R:ANT"],
      { entityClasses: [EntityEnums.Class.Concept] },
      conn
    );
    expect(sorted(ids)).toEqual(sorted([HOT, COLD]));
    expect(ids).not.toContain(ORPHAN);
  });

  test("R:SYN matches every other member of the cloud, never the target itself", async () => {
    if (!conn) return;
    const ids = await runEdge(Query.EdgeType["R:SYN"], { entityId: HOT }, conn);
    expect(sorted(ids)).toEqual(sorted([WARM, BOILING]));
    expect(ids).not.toContain(HOT);
  });

  test("R:PRR matches a self loop but an ordinary pair still cannot match itself", async () => {
    if (!conn) return;
    expect(
      await runEdge(Query.EdgeType["R:PRR"], { entityId: LONELY }, conn)
    ).toEqual([LONELY]);
    const forHot = await runEdge(
      Query.EdgeType["R:PRR"],
      { entityId: HOT },
      conn
    );
    expect(forHot).toEqual([WARM]);
    expect(forHot).not.toContain(HOT);
  });

  test("R:IDE matches from either side", async () => {
    if (!conn) return;
    expect(
      await runEdge(Query.EdgeType["R:IDE"], { entityId: AUGUSTUS }, conn)
    ).toEqual([CAESAR]);
    expect(
      await runEdge(Query.EdgeType["R:IDE"], { entityId: CAESAR }, conn)
    ).toEqual([AUGUSTUS]);
  });

  test("R:HOL walks entityIds[0] -> entityIds[1] and not the reverse", async () => {
    if (!conn) return;
    expect(
      await runEdge(Query.EdgeType["R:HOL"], { entityId: HOT }, conn)
    ).toEqual([BOILING]);
    expect(
      await runEdge(Query.EdgeType["R:HOL"], { entityId: BOILING }, conn)
    ).toEqual([]);
  });

  test("R:IMP resolves to the Implication relation, not some other type", async () => {
    if (!conn) return;
    expect(
      await runEdge(Query.EdgeType["R:IMP"], { entityId: WALKING }, conn)
    ).toEqual([RUNNING]);
    // RUNNING is Related to HOT, which the Implication edge must not see
    expect(
      await runEdge(Query.EdgeType["R:IMP"], { entityId: HOT }, conn)
    ).toEqual([]);
  });

  test("R:HOL by class narrows the holonym to entities of that class", async () => {
    if (!conn) return;
    expect(
      await runEdge(
        Query.EdgeType["R:HOL"],
        { entityClasses: [EntityEnums.Class.Concept] },
        conn
      )
    ).toEqual([BOILING]);
    expect(
      await runEdge(
        Query.EdgeType["R:HOL"],
        { entityClasses: [EntityEnums.Class.Action] },
        conn
      )
    ).toEqual([]);
  });
});
