import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the R:SCL (Superclass) edge against a real
// RethinkDB. Like superordinate-edge-reql.test.ts it creates/drops its OWN
// throwaway db, so it can never touch real data, and it self-skips when no
// RethinkDB is reachable on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_superclass_edge";
const ENTITIES = "entities";
const RELATIONS = "relations";

// --- concept / action ids ---
const ANIMAL = "con-animal"; // the Concept superclass we search by
const VEHICLE = "con-vehicle"; // a different Concept superclass
const DOG = "con-dog"; // subclass of Animal
const CAT = "con-cat"; // subclass of Animal
const CAR = "con-car"; // subclass of Vehicle
const MOVE = "act-move"; // an ACTION superclass (class-filter fixture)
const RUN = "act-run"; // subclass of the Move action
const GHOST = "con-ghost"; // subclass of a MISSING (dangling) superclass
const PLANT = "con-plant"; // related to Animal by a NON-superclass relation

const entity = (id: string, cls = EntityEnums.Class.Concept) => ({
  id,
  class: cls,
});
const ENTITY_FIXTURES = [
  ...[ANIMAL, VEHICLE, DOG, CAT, CAR, GHOST, PLANT].map((id) => entity(id)),
  entity(MOVE, EntityEnums.Class.Action),
  entity(RUN, EntityEnums.Class.Action),
];

// Superclass relation: entityIds = [subclass, superclass]
const scl = (subclass: string, superclass: string) => ({
  id: `scl-${subclass}-${superclass}`,
  type: RelationEnums.Type.Superclass,
  entityIds: [subclass, superclass],
});
const RELATION_FIXTURES = [
  scl(DOG, ANIMAL),
  scl(CAT, ANIMAL),
  scl(CAR, VEHICLE),
  scl(RUN, MOVE),
  // dangling superclass: entity row does not exist
  scl(GHOST, "missing-superclass"),
  // a non-superclass relation between PLANT and ANIMAL - must be ignored
  {
    id: "rel-plant-animal",
    type: RelationEnums.Type.Related,
    entityIds: [PLANT, ANIMAL],
  },
];

const runEdge = (
  nodeParams: Query.INodeParams,
  conn: Connection
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["R:SCL"],
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

describe("R:SCL (Superclass) edge (real ReQL)", () => {
  let conn: Connection | null = null;

  beforeAll(async () => {
    try {
      conn = await r.connect({ host: HOST, port: PORT, timeout: 2 });
    } catch {
      // eslint-disable-next-line no-console
      console.warn(
        `[superclass-edge-reql] no RethinkDB on ${HOST}:${PORT} - skipping real-ReQL suite`
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

  test("by entity: returns the subclasses of Animal, not Animal itself", async () => {
    if (!conn) return;
    const ids = await runEdge({ entityId: ANIMAL }, conn);
    expect(sorted(ids)).toEqual(sorted([DOG, CAT]));
    expect(ids).not.toContain(ANIMAL);
    expect(ids).not.toContain(CAR);
  });

  test("only the Superclass relation type matches (Related is ignored)", async () => {
    if (!conn) return;
    const ids = await runEdge({ entityId: ANIMAL }, conn);
    expect(ids).not.toContain(PLANT);
  });

  test("no target: returns every entity that has any superclass", async () => {
    if (!conn) return;
    const ids = await runEdge({}, conn);
    expect(sorted(ids)).toEqual(sorted([DOG, CAT, CAR, RUN, GHOST]));
  });

  test("by class: Concept superclasses only (Action-superclassed and dangling excluded)", async () => {
    if (!conn) return;
    const ids = await runEdge(
      { entityClasses: [EntityEnums.Class.Concept] },
      conn
    );
    expect(sorted(ids)).toEqual(sorted([DOG, CAT, CAR]));
    expect(ids).not.toContain(RUN); // superclass is an Action
    expect(ids).not.toContain(GHOST); // dangling superclass fails the class check
  });

  test("by class: Action superclasses only", async () => {
    if (!conn) return;
    const ids = await runEdge({ entityClasses: [EntityEnums.Class.Action] }, conn);
    expect(sorted(ids)).toEqual(sorted([RUN]));
  });

  test("entityId wins over entityClasses when both are set", async () => {
    if (!conn) return;
    const ids = await runEdge(
      { entityId: ANIMAL, entityClasses: [EntityEnums.Class.Action] },
      conn
    );
    expect(sorted(ids)).toEqual(sorted([DOG, CAT]));
  });
});
