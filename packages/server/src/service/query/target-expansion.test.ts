import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Explore, Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";
import QuerySearch from "./search";
import { clearQueryBaseCache } from "./query-base-cache";

// Verifies the per-node expansion toggles (includeEquivalents /
// includeSubordinates, #2969) against the ACTUAL ReQL of the edges, plus the
// ROOT-node half of the feature: QuerySearch expanding the final RESULT
// id list ("also include entities equivalent/subordinate to the query
// results") after the explore filters, inside getResults()/getStats(). When an
// edge's target node is pinned to an entityId, prepare() expands the single id
// into the pinned id ∪ equivalents (SYN/AEE/IDE) ∪ subordinates (inverse
// SCL/SOE/HOL + child territories, all levels) per the toggles, and run() must
// match against ANY id of that set. With both toggles off the results must be
// identical to the single-id behavior; an unpinned target ignores the toggles
// entirely. It creates/drops its OWN throwaway db, so it never touches real
// data. Runs only when a RethinkDB is reachable on DB_HOST/DB_PORT (defaults
// localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_target_expansion";
const ENTITIES = "entities";
const RELATIONS = "relations";

// territory tree (for SUT: + includeSubordinates):
//   TX               <- pinned target
//   ├─ TX_CHILD
//   │   └─ TX_GRAND  <- grandchild (depth check)
//   T_OTHER          <- sibling root (its statements must NOT match)
const TX = "t-x";
const TX_CHILD = "t-x-child";
const TX_GRAND = "t-x-grand";
const T_OTHER = "t-other";

// classification cloud (for R:CLA + includeEquivalents):
//   PERSON1 -CLA-> CONCEPT_A  <- pinned target
//   PERSON2 -CLA-> CONCEPT_B, CONCEPT_B -SYN-> CONCEPT_A
//   PERSON3 -CLA-> CONCEPT_C  <- unrelated concept (must NOT match)
const CONCEPT_A = "concept-a";
const CONCEPT_B = "concept-b";
const CONCEPT_C = "concept-c";
const PERSON1 = "person-1";
const PERSON2 = "person-2";
const PERSON3 = "person-3";

const territory = (id: string, parentId: string | null, labels: string[] = []) => ({
  id,
  class: EntityEnums.Class.Territory,
  labels,
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

const entity = (id: string, cls: EntityEnums.Class) => ({ id, class: cls });

const ENTITY_FIXTURES = [
  territory(TX, null, ["The Call of the Wild"]),
  territory(TX_CHILD, TX, ["Chapter one"]),
  territory(TX_GRAND, TX_CHILD, ["Section a"]),
  territory(T_OTHER, null, ["Another book"]),
  statement("ST_X", TX),
  statement("ST_CHILD", TX_CHILD),
  statement("ST_GRAND", TX_GRAND),
  statement("ST_OTHER", T_OTHER),
  entity(CONCEPT_A, EntityEnums.Class.Concept),
  entity(CONCEPT_B, EntityEnums.Class.Concept),
  entity(CONCEPT_C, EntityEnums.Class.Concept),
  entity(PERSON1, EntityEnums.Class.Person),
  entity(PERSON2, EntityEnums.Class.Person),
  entity(PERSON3, EntityEnums.Class.Person),
];

const RELATION_FIXTURES = [
  {
    id: "rel-cla-1",
    type: RelationEnums.Type.Classification,
    entityIds: [PERSON1, CONCEPT_A],
  },
  {
    id: "rel-cla-2",
    type: RelationEnums.Type.Classification,
    entityIds: [PERSON2, CONCEPT_B],
  },
  {
    id: "rel-cla-3",
    type: RelationEnums.Type.Classification,
    entityIds: [PERSON3, CONCEPT_C],
  },
  {
    id: "rel-syn-ab",
    type: RelationEnums.Type.Synonym,
    entityIds: [CONCEPT_A, CONCEPT_B],
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
  // the node evaluator always calls prepare() before run() - the expansion is
  // resolved there
  await edge.prepare(conn);
  return edge.run(r.table(ENTITIES)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("target expansion toggles on pinned edge targets (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(ENTITIES).run(conn);
    await r.tableCreate(RELATIONS).run(conn);
    // the expansion helpers (getEquivalentEntityIds / getSubordinateEntityIds)
    // and the R:CLA edge read relations via this multi index (mirrors
    // indexes.ts). Territory descendants are resolved via Territory.findChilds
    // - treeCache is empty under NODE_ENV=test, so it takes the DB fallback
    // (a plain class+parent filter, no index needed).
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

  describe("SUT: (S under T) + includeSubordinates", () => {
    test("toggles off: only statements directly under the pinned territory", async () => {
      const ids = await runEdge(
        Query.EdgeType["SUT:"],
        { entityId: TX, includeEquivalents: false, includeSubordinates: false },
        conn
      );
      expect(sorted(ids)).toEqual(["ST_X"]);
    });

    test("includeSubordinates: statements under the pinned territory OR any descendant match", async () => {
      const ids = await runEdge(
        Query.EdgeType["SUT:"],
        { entityId: TX, includeEquivalents: false, includeSubordinates: true },
        conn
      );
      expect(sorted(ids)).toEqual(sorted(["ST_X", "ST_CHILD", "ST_GRAND"]));
      expect(ids).not.toContain("ST_OTHER");
    });

    test("toggles absent behaves identically to toggles explicitly false (regression)", async () => {
      const absent = await runEdge(Query.EdgeType["SUT:"], { entityId: TX }, conn);
      const explicit = await runEdge(
        Query.EdgeType["SUT:"],
        { entityId: TX, includeEquivalents: false, includeSubordinates: false },
        conn
      );
      expect(sorted(absent)).toEqual(sorted(explicit));
      expect(sorted(absent)).toEqual(["ST_X"]);
    });
  });

  describe("R:CLA (classification) + includeEquivalents", () => {
    test("toggles off: only entities classified directly as the pinned concept", async () => {
      const ids = await runEdge(
        Query.EdgeType["R:CLA"],
        {
          entityId: CONCEPT_A,
          includeEquivalents: false,
          includeSubordinates: false,
        },
        conn
      );
      expect(sorted(ids)).toEqual([PERSON1]);
    });

    test("includeEquivalents: entities classified as a SYN-equivalent of the target also match", async () => {
      const ids = await runEdge(
        Query.EdgeType["R:CLA"],
        {
          entityId: CONCEPT_A,
          includeEquivalents: true,
          includeSubordinates: false,
        },
        conn
      );
      expect(sorted(ids)).toEqual(sorted([PERSON1, PERSON2]));
      expect(ids).not.toContain(PERSON3);
    });

    test("both toggles false gives identical results to toggles absent (regression)", async () => {
      const absent = await runEdge(
        Query.EdgeType["R:CLA"],
        { entityId: CONCEPT_A },
        conn
      );
      const explicit = await runEdge(
        Query.EdgeType["R:CLA"],
        {
          entityId: CONCEPT_A,
          includeEquivalents: false,
          includeSubordinates: false,
        },
        conn
      );
      expect(sorted(absent)).toEqual(sorted(explicit));
      expect(sorted(absent)).toEqual([PERSON1]);
    });

    test("unpinned target: toggles have no effect (any classification matches)", async () => {
      const unpinned = await runEdge(Query.EdgeType["R:CLA"], {}, conn);
      const unpinnedToggled = await runEdge(
        Query.EdgeType["R:CLA"],
        { includeEquivalents: true, includeSubordinates: true },
        conn
      );
      expect(sorted(unpinnedToggled)).toEqual(sorted(unpinned));
      expect(sorted(unpinned)).toEqual(sorted([PERSON1, PERSON2, PERSON3]));
    });
  });

  // root-node toggles expand the final RESULT list, not an edge match set.
  // The expansion runs per request on the FILTERED set (after
  // applyExploreFilters, inside getResults/getStats): direct filtered matches
  // first (sorted as usual), expansion ids appended without duplicates and
  // NOT subject to the explore filters, expansion never re-expanded. Tests go
  // through the real request flow (run() then getResults()) and read the
  // final results.items - exactly what the /query route returns as entityIds.
  describe("root result expansion (QuerySearch getResults/getStats)", () => {
    const runQuery = async (
      params: Query.INodeParams,
      filters: Explore.IExploreSearchFilter[] = []
    ): Promise<string[]> => {
      const search = new QuerySearch(
        {
          id: "root",
          type: Query.NodeType.E,
          operator: Query.NodeOperator.And,
          params,
          edges: [],
        },
        {
          view: { mode: Explore.EViewMode.Table, columns: [] },
          filters,
          sort: undefined,
          limit: 0,
          offset: 0,
        }
      );
      await search.run(conn);
      await search.getResults(conn);
      return search.results?.items ?? [];
    };

    // the base-query cache is module-level and would otherwise leak identical
    // queries between tests
    beforeEach(() => clearQueryBaseCache());

    test("includeSubordinates: subordinates of the matches are appended after the direct matches", async () => {
      const ids = await runQuery({ entityId: TX, includeSubordinates: true });
      // direct match keeps first position; descendants (all levels) follow
      expect(ids[0]).toEqual(TX);
      expect(sorted(ids.slice(1))).toEqual(sorted([TX_CHILD, TX_GRAND]));
      expect(ids).not.toContain(T_OTHER);

      // the cache holds the RAW unexpanded ids - a cache-hit re-run of the
      // identical query still returns the same expanded ids because the
      // expansion is a per-request step
      const cached = await runQuery({
        entityId: TX,
        includeSubordinates: true,
      });
      expect(cached).toEqual(ids);
    });

    test("includeEquivalents: SYN-equivalent of a matched entity appears in the results", async () => {
      const ids = await runQuery({
        entityId: CONCEPT_A,
        includeEquivalents: true,
      });
      expect(ids).toEqual([CONCEPT_A, CONCEPT_B]);
      expect(ids).not.toContain(CONCEPT_C);
    });

    test("toggles off: results identical to the plain query (regression)", async () => {
      const absent = await runQuery({ entityId: TX });
      const explicit = await runQuery({
        entityId: TX,
        includeEquivalents: false,
        includeSubordinates: false,
      });
      expect(absent).toEqual([TX]);
      expect(explicit).toEqual(absent);
    });

    test("a direct match that is also a subordinate of another match appears once, in its direct-match position", async () => {
      // all territories match directly; TX_CHILD / TX_GRAND are additionally
      // subordinates of TX, so the expansion must not re-add (or move) them
      const direct = await runQuery({
        entityClasses: [EntityEnums.Class.Territory],
      });
      const expanded = await runQuery({
        entityClasses: [EntityEnums.Class.Territory],
        includeSubordinates: true,
      });
      expect(sorted(direct)).toEqual(
        sorted([TX, TX_CHILD, TX_GRAND, T_OTHER])
      );
      expect(expanded).toEqual(direct);
    });

    // #3194 repro: root matches ALL territories, a label filter narrows the
    // direct matches to TX only, and includeSubordinates must then expand THAT
    // filtered territory's subtree - the children appear even though their own
    // labels do not match the filter (expansions are additions, not matches)
    test("label filter narrows the matches BEFORE expansion; subtree of the filtered match is appended", async () => {
      const labelFilter: Explore.IExploreSearchFilter = {
        type: Explore.SearchOption.Label,
        label: "call of",
      };
      const ids = await runQuery(
        {
          entityClasses: [EntityEnums.Class.Territory],
          includeSubordinates: true,
        },
        [labelFilter]
      );
      // filtered direct match first, its descendants appended after
      expect(ids[0]).toEqual(TX);
      expect(sorted(ids.slice(1))).toEqual(sorted([TX_CHILD, TX_GRAND]));
      // the other root territory (and thus its subtree) must be absent
      expect(ids).not.toContain(T_OTHER);
    });

    test("cache-hit path: a second identical query still filters first and expands after (regression)", async () => {
      const labelFilter: Explore.IExploreSearchFilter = {
        type: Explore.SearchOption.Label,
        label: "call of",
      };
      const params: Query.INodeParams = {
        entityClasses: [EntityEnums.Class.Territory],
        includeSubordinates: true,
      };
      const first = await runQuery(params, [labelFilter]);
      // second QuerySearch hits the base-query cache (raw unexpanded ids) and
      // must produce the identical filtered-then-expanded result
      const second = await runQuery(params, [labelFilter]);
      expect(first[0]).toEqual(TX);
      expect(sorted(first.slice(1))).toEqual(sorted([TX_CHILD, TX_GRAND]));
      expect(second).toEqual(first);
    });
  });
});
