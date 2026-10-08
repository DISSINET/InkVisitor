import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getNodeExpansionIds } from "./node-expansion";
import { getEdgeInstance } from "./edge";

// Verifies getNodeExpansionIds against real ReQL, and that EdgeI.prepare()
// resolves the SAME id set - the invariant the whole feature rests on, since
// the popover renders the resolver's output while the query matches
// prepare()'s. Creates and drops its own throwaway db, so it never touches
// real data. Needs a RethinkDB on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_node_expansion";
const ENTITIES = "entities";
const RELATIONS = "relations";

// CONCEPT_A  -SYN->  CONCEPT_B          (equivalent)
// CONCEPT_SUB -SCL-> CONCEPT_A          (subordinate: inverse superclass)
// CONCEPT_BOTH -SCL-> CONCEPT_A  and  CONCEPT_BOTH -SYN-> CONCEPT_A
//                                       (reachable both ways -> equivalents win)
// CONCEPT_FAR                            (unrelated, must never appear)
const CONCEPT_A = "concept-a";
const CONCEPT_B = "concept-b";
const CONCEPT_SUB = "concept-sub";
const CONCEPT_BOTH = "concept-both";
const CONCEPT_FAR = "concept-far";

const entity = (id: string) => ({
  id,
  class: EntityEnums.Class.Concept,
  status: EntityEnums.Status.Approved,
  labels: [id],
  data: {},
});

const ENTITY_FIXTURES = [
  entity(CONCEPT_A),
  entity(CONCEPT_B),
  entity(CONCEPT_SUB),
  entity(CONCEPT_BOTH),
  entity(CONCEPT_FAR),
];

const RELATION_FIXTURES = [
  {
    id: "rel-syn-ab",
    type: RelationEnums.Type.Synonym,
    entityIds: [CONCEPT_A, CONCEPT_B],
  },
  {
    // Superclass is ordered: entityIds[0] is the subclass, [1] the superclass
    id: "rel-scl-sub",
    type: RelationEnums.Type.Superclass,
    entityIds: [CONCEPT_SUB, CONCEPT_A],
  },
  {
    id: "rel-scl-both",
    type: RelationEnums.Type.Superclass,
    entityIds: [CONCEPT_BOTH, CONCEPT_A],
  },
  {
    id: "rel-syn-both",
    type: RelationEnums.Type.Synonym,
    entityIds: [CONCEPT_A, CONCEPT_BOTH],
  },
];

const sorted = (a: string[]) => [...a].sort();

describe("getNodeExpansionIds", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(ENTITIES).run(conn);
    await r.tableCreate(RELATIONS).run(conn);
    // the expansion helpers read relations through this multi index
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

  test("both toggles off: empty groups, no expansion", async () => {
    const res = await getNodeExpansionIds(conn, CONCEPT_A, {
      equivalents: false,
      subordinates: false,
    });
    expect(res).toEqual({ equivalents: [], subordinates: [] });
  });

  test("equivalents only", async () => {
    const res = await getNodeExpansionIds(conn, CONCEPT_A, {
      equivalents: true,
      subordinates: false,
    });
    expect(sorted(res.equivalents)).toEqual(sorted([CONCEPT_B, CONCEPT_BOTH]));
    expect(res.subordinates).toEqual([]);
  });

  test("subordinates only", async () => {
    const res = await getNodeExpansionIds(conn, CONCEPT_A, {
      equivalents: false,
      subordinates: true,
    });
    expect(res.equivalents).toEqual([]);
    expect(sorted(res.subordinates)).toEqual(sorted([CONCEPT_SUB, CONCEPT_BOTH]));
  });

  test("both on: an id reachable either way is reported as an equivalent only", async () => {
    const res = await getNodeExpansionIds(conn, CONCEPT_A, {
      equivalents: true,
      subordinates: true,
    });
    expect(res.equivalents).toContain(CONCEPT_BOTH);
    expect(res.subordinates).not.toContain(CONCEPT_BOTH);
    expect(sorted(res.subordinates)).toEqual([CONCEPT_SUB]);
  });

  test("the pinned entity never appears in either group", async () => {
    const res = await getNodeExpansionIds(conn, CONCEPT_A, {
      equivalents: true,
      subordinates: true,
    });
    expect(res.equivalents).not.toContain(CONCEPT_A);
    expect(res.subordinates).not.toContain(CONCEPT_A);
  });

  test("unrelated entities never appear", async () => {
    const res = await getNodeExpansionIds(conn, CONCEPT_A, {
      equivalents: true,
      subordinates: true,
    });
    expect([...res.equivalents, ...res.subordinates]).not.toContain(CONCEPT_FAR);
  });

  test("agrees with EdgeI.prepare(): same node params, same resolved target set", async () => {
    const params: Query.INodeParams = {
      entityId: CONCEPT_A,
      includeEquivalents: true,
      includeSubordinates: true,
    };
    const edge = getEdgeInstance({
      id: "e1",
      type: Query.EdgeType["R:CLA"],
      params: {},
      logic: Query.EdgeLogic.Positive,
      node: {
        id: "n1",
        type: Query.NodeType.E,
        operator: Query.NodeOperator.And,
        params,
        edges: [],
      },
    });
    await edge.prepare(conn);

    const res = await getNodeExpansionIds(conn, CONCEPT_A, {
      equivalents: true,
      subordinates: true,
    });
    const fromResolver = sorted([
      CONCEPT_A,
      ...res.equivalents,
      ...res.subordinates,
    ]);

    // targetEntityIds is protected; the agreement is what matters, not access
    const fromPrepare = sorted(
      ((edge as unknown as { targetEntityIds: string[] }).targetEntityIds) ?? []
    );
    expect(fromPrepare).toEqual(fromResolver);
  });
});
