import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the I_R:CLA (instances) edge against a real
// RethinkDB. Like superclass-edge-reql.test.ts it creates/drops its OWN
// throwaway db, so it can never touch real data, and it self-skips when no
// RethinkDB is reachable on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_classification_edge";
const ENTITIES = "entities";
const RELATIONS = "relations";

const PAINTER = "con-painter"; // the Concept classifying persons
const CITY = "con-city"; // the Concept classifying locations
const UNUSED = "con-unused"; // a Concept with no instances
const GIOTTO = "per-giotto"; // classified as Painter
const TITIAN = "per-titian"; // classified as Painter
const VENICE = "loc-venice"; // classified as City

const ENTITY_FIXTURES = [
  { id: PAINTER, class: EntityEnums.Class.Concept },
  { id: CITY, class: EntityEnums.Class.Concept },
  { id: UNUSED, class: EntityEnums.Class.Concept },
  { id: GIOTTO, class: EntityEnums.Class.Person },
  { id: TITIAN, class: EntityEnums.Class.Person },
  { id: VENICE, class: EntityEnums.Class.Location },
];

// Classification relation: entityIds = [instance, concept]
const cla = (instance: string, concept: string) => ({
  id: `cla-${instance}-${concept}`,
  type: RelationEnums.Type.Classification,
  entityIds: [instance, concept],
});
const RELATION_FIXTURES = [
  cla(GIOTTO, PAINTER),
  cla(TITIAN, PAINTER),
  cla(VENICE, CITY),
  // a non-classification relation between UNUSED and GIOTTO - must be ignored
  {
    id: "rel-unused-giotto",
    type: RelationEnums.Type.Related,
    entityIds: [UNUSED, GIOTTO],
  },
];

const runEdge = (nodeParams: Query.INodeParams, conn: Connection): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["I_R:CLA"],
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

describe("I_R:CLA (instances, inverse Classification) edge (real ReQL)", () => {
  let conn: Connection | null = null;

  beforeAll(async () => {
    try {
      conn = await r.connect({ host: HOST, port: PORT, timeout: 2 });
    } catch {
      // eslint-disable-next-line no-console
      console.warn(
        `[classification-edge-reql] no RethinkDB on ${HOST}:${PORT} - skipping real-ReQL suite`
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

  test("by entity: returns the concept Giotto is an instance of, not Giotto", async () => {
    if (!conn) return;
    expect(await runEdge({ entityId: GIOTTO }, conn)).toEqual([PAINTER]);
  });

  test("only the Classification relation type matches (Related is ignored)", async () => {
    if (!conn) return;
    const ids = await runEdge({ entityId: GIOTTO }, conn);
    expect(ids).not.toContain(UNUSED);
  });

  test("an instance is never matched as its own concept", async () => {
    if (!conn) return;
    expect(await runEdge({ entityId: PAINTER }, conn)).toEqual([]);
  });

  test("no target: returns every concept that has any instance", async () => {
    if (!conn) return;
    expect(sorted(await runEdge({}, conn))).toEqual(sorted([PAINTER, CITY]));
  });

  test("by class: concepts with Location instances only", async () => {
    if (!conn) return;
    const ids = await runEdge({ entityClasses: [EntityEnums.Class.Location] }, conn);
    expect(ids).toEqual([CITY]);
  });
});
