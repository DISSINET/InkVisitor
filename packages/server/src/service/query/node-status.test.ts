import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";
import SearchNode from "./nodes";

// Verifies the entityStatuses node param against the ACTUAL ReQL: on a target
// node it narrows what an edge may point AT (the "which entities use a
// discouraged C in a metaprop or a relation" case), on the root node it narrows
// the base set itself. The constraint is resolved into a target-id set in
// SearchEdge.prepare(), so it must hold for every edge type - prop type, prop
// value and relation edges are covered here. It creates/drops its OWN throwaway
// db, so it never touches real data. Runs only when a RethinkDB is reachable on
// DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_node_status";
const ENTITIES = "entities";
const RELATIONS = "relations";

const C_BAD = "concept-discouraged";
const C_OK = "concept-approved";
const A_BAD = "action-discouraged";
const P_PROP_TYPE = "person-prop-type"; // discouraged C as prop TYPE
const P_PROP_VALUE = "person-prop-value"; // discouraged C as prop VALUE
const P_PROP_CLEAN = "person-prop-clean"; // approved C on both sides
const P_CLA_BAD = "person-cla-bad"; // classified as the discouraged C
const P_CLA_OK = "person-cla-ok";

const concept = (id: string, status: EntityEnums.Status) => ({
  id,
  class: EntityEnums.Class.Concept,
  status,
  props: [],
});

const prop = (typeId: string, valueId: string) => ({
  id: `${typeId}-${valueId}`,
  type: { entityId: typeId },
  value: { entityId: valueId },
  children: [],
});

const person = (id: string, props: ReturnType<typeof prop>[]) => ({
  id,
  class: EntityEnums.Class.Person,
  status: EntityEnums.Status.Approved,
  props,
});

const ENTITY_FIXTURES = [
  concept(C_BAD, EntityEnums.Status.Discouraged),
  concept(C_OK, EntityEnums.Status.Approved),
  {
    id: A_BAD,
    class: EntityEnums.Class.Action,
    status: EntityEnums.Status.Discouraged,
    props: [],
  },
  person(P_PROP_TYPE, [prop(C_BAD, C_OK)]),
  person(P_PROP_VALUE, [prop(C_OK, C_BAD)]),
  person(P_PROP_CLEAN, [prop(C_OK, C_OK)]),
  person(P_CLA_BAD, []),
  person(P_CLA_OK, []),
];

const RELATION_FIXTURES = [
  {
    id: "rel-cla-bad",
    type: RelationEnums.Type.Classification,
    entityIds: [P_CLA_BAD, C_BAD],
  },
  {
    id: "rel-cla-ok",
    type: RelationEnums.Type.Classification,
    entityIds: [P_CLA_OK, C_OK],
  },
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
  // the node evaluator always calls prepare() before run() - the status
  // constraint is resolved into the target-id set there
  await edge.prepare(conn);
  return edge.run(r.table(ENTITIES)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

const DISCOURAGED_C: Query.INodeParams = {
  entityClasses: [EntityEnums.Class.Concept],
  entityStatuses: [EntityEnums.Status.Discouraged],
};

describe("entityStatuses node param (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(ENTITIES).run(conn);
    await r.tableCreate(RELATIONS).run(conn);
    // a status-constrained target with classes is resolved through the class
    // index (mirrors indexes.ts); the R:CLA edge reads relations via the multi
    // index on entityIds
    await r.table(ENTITIES).indexCreate(DbEnums.Indexes.Class).run(conn);
    await r.table(ENTITIES).indexWait(DbEnums.Indexes.Class).run(conn);
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

  describe("target node", () => {
    test("EP:T matches only entities whose prop TYPE is a discouraged concept", async () => {
      const ids = await runEdge(Query.EdgeType["EP:T"], DISCOURAGED_C, conn);
      expect(sorted(ids)).toEqual([P_PROP_TYPE]);
    });

    test("HP:V matches only entities whose prop VALUE is a discouraged concept", async () => {
      const ids = await runEdge(Query.EdgeType["HP:V"], DISCOURAGED_C, conn);
      expect(sorted(ids)).toEqual([P_PROP_VALUE]);
    });

    test("R:CLA matches only entities classified as a discouraged concept", async () => {
      const ids = await runEdge(Query.EdgeType["R:CLA"], DISCOURAGED_C, conn);
      expect(sorted(ids)).toEqual([P_CLA_BAD]);
    });

    test("without the status param every prop origin still matches", async () => {
      const ids = await runEdge(
        Query.EdgeType["EP:T"],
        { entityClasses: [EntityEnums.Class.Concept] },
        conn
      );
      expect(sorted(ids)).toEqual(
        sorted([P_PROP_TYPE, P_PROP_VALUE, P_PROP_CLEAN])
      );
    });

    test("the target class still applies: an Action-only target matches nothing here", async () => {
      const ids = await runEdge(
        Query.EdgeType["EP:T"],
        {
          entityClasses: [EntityEnums.Class.Action],
          entityStatuses: [EntityEnums.Status.Discouraged],
        },
        conn
      );
      expect(ids).toEqual([]);
    });

    test("a status no entity carries matches nothing", async () => {
      const ids = await runEdge(
        Query.EdgeType["EP:T"],
        {
          entityClasses: [EntityEnums.Class.Concept],
          entityStatuses: [EntityEnums.Status.Unfinished],
        },
        conn
      );
      expect(ids).toEqual([]);
    });

    test("classless target: the status alone spans every class", async () => {
      const ids = await runEdge(
        Query.EdgeType["EP:T"],
        { entityStatuses: [EntityEnums.Status.Discouraged] },
        conn
      );
      expect(sorted(ids)).toEqual([P_PROP_TYPE]);
    });
  });

  describe("root node", () => {
    const runNode = async (params: Query.INodeParams): Promise<string[]> => {
      const node = new SearchNode({
        id: "n0",
        type: Query.NodeType.E,
        operator: Query.NodeOperator.And,
        params,
        edges: [],
      });
      const results = await node.run(conn);
      return results.items ?? [];
    };

    test("the base set is narrowed to the given statuses", async () => {
      const ids = await runNode({
        entityStatuses: [EntityEnums.Status.Discouraged],
      });
      expect(sorted(ids)).toEqual(sorted([C_BAD, A_BAD]));
    });

    test("statuses combine with classes as AND", async () => {
      const ids = await runNode(DISCOURAGED_C);
      expect(sorted(ids)).toEqual([C_BAD]);
    });
  });
});
