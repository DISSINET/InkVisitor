import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the EUT: edge ("used in statements under T"):
// every entity USED in a statement directly under the
// target Territory should be returned (broad Statement.getEntitiesIds() set:
// actants, actions, tags, in-statement prop type/value incl. nested children,
// references, classifications/identifications). It creates/drops its OWN
// throwaway db, so it never touches real data. Runs only when a RethinkDB is
// reachable on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_used_under_territory_edge";
const TABLE = "entities";

const T1 = "t-1"; // the target territory
const T2 = "t-2"; // a sibling territory (its statements must NOT match T1)
const T1_CHILD = "t-1-child"; // child of T1 (direct-only -> must NOT match T1)
const T_RAW = "t-raw"; // holds a legacy actant row missing optional fields

const prop = (typeId: string, valueId: string, children: any[] = []) => ({
  type: { entityId: typeId },
  value: { entityId: valueId },
  children,
});
const actant = (entityId: string, position: EntityEnums.Position, extra: any = {}) => ({
  id: `sa-${entityId}`,
  entityId,
  position,
  props: [],
  classifications: [],
  identifications: [],
  ...extra,
});
const action = (actionId: string, props: any[] = []) => ({
  id: `act-${actionId}`,
  actionId,
  props,
});
const entity = (id: string, cls: EntityEnums.Class = EntityEnums.Class.Concept) => ({
  id,
  class: cls,
});
const statement = (id: string, territoryId: string, opts: any = {}) => ({
  id,
  class: EntityEnums.Class.Statement,
  props: opts.props ?? [],
  references: opts.references ?? [],
  data: {
    territory: { territoryId, order: 1 },
    actions: opts.actions ?? [],
    actants: opts.actants ?? [],
    tags: opts.tags ?? [],
  },
});

// every entity id referenced from ST_T1, across every "used" role
const USED_IN_T1 = [
  "SPROPTYPE1", // statement-level prop type
  "SPROPVAL1", //  statement-level prop value
  "REFRES1", //    reference resource
  "REFVAL1", //    reference value
  "ACTION1", //    action id
  "APT1", //       action prop type
  "APV1", //       action prop value
  "ACTANT1", //    actant entity
  "CLASSIF1", //   actant classification
  "IDENT1", //     actant identification
  "PROPTYPE1", //  actant prop type
  "PROPVAL1", //   actant prop value
  "N2T", //        nested (lvl2) prop type
  "N2V", //        nested (lvl2) prop value
  "N3T", //        nested (lvl3) prop type
  "NESTED3", //    nested (lvl3) prop value
  "TAG1", //       tag
];

const ST_T1 = statement("ST_T1", T1, {
  props: [prop("SPROPTYPE1", "SPROPVAL1")],
  references: [{ resource: "REFRES1", value: "REFVAL1" }],
  actions: [action("ACTION1", [prop("APT1", "APV1")])],
  actants: [
    actant("ACTANT1", EntityEnums.Position.Subject, {
      props: [prop("PROPTYPE1", "PROPVAL1", [prop("N2T", "N2V", [prop("N3T", "NESTED3")])])],
      classifications: [{ entityId: "CLASSIF1" }],
      identifications: [{ entityId: "IDENT1" }],
    }),
  ],
  // GHOST has no entity fixture -> it is "used" but must be filtered out by the
  // intersection with the candidate stream (the subset invariant)
  tags: ["TAG1", "GHOST"],
});

const FIXTURES = [
  entity(T1, EntityEnums.Class.Territory),
  entity(T2, EntityEnums.Class.Territory),
  entity(T1_CHILD, EntityEnums.Class.Territory),
  // a real entity for every id used in ST_T1
  ...USED_IN_T1.map((id) => entity(id)),
  // used only in another territory's statement
  entity("ACTANT2"),
  // exists but used in no statement
  entity("LONELY"),
  // a legacy/raw actant used in a T_RAW statement
  entity("RAWACTANT", EntityEnums.Class.Person),
  ST_T1,
  // a statement whose actant lacks classifications/identifications entirely
  // (only entityId/position/props) - must not abort the edge query
  statement("ST_RAW", T_RAW, {
    actants: [
      {
        id: "sa-raw",
        entityId: "RAWACTANT",
        position: EntityEnums.Position.Subject,
        props: [],
      },
    ],
  }),
  statement("ST_T2", T2, {
    actants: [actant("ACTANT2", EntityEnums.Position.Subject)],
  }),
  statement("ST_CHILD", T1_CHILD, {
    actants: [actant("ACTANT1", EntityEnums.Position.Actant1)],
  }),
];

const runEdge = (
  params: Query.INodeParams,
  conn: Connection
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["EUT:"],
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
  return edge.run(r.table(TABLE)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("EUT: edge / used in statements under T (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(TABLE).run(conn);
    // the edge reads candidate statements via this index (mirrors indexes.ts);
    // entities without data.territory are simply skipped by the index function
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

  test("returns the full broad 'used' set of the territory's statements", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(sorted(ids)).toEqual(sorted(USED_IN_T1));
  });

  test("entities used only in another territory's statements are excluded", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(ids).not.toContain("ACTANT2");
  });

  test("direct territory only: statements in a child territory do not count", async () => {
    // ACTANT1 IS in T1 directly (so it's returned), but it must come from ST_T1,
    // not the ST_CHILD statement under T1_CHILD. Querying the child territory
    // directly returns ACTANT1; querying T1 must NOT pull in child-only usage.
    const childIds = await runEdge({ entityId: T1_CHILD }, conn);
    expect(sorted(childIds)).toEqual(["ACTANT1"]);
  });

  test("the target territory itself is not returned as 'used'", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(ids).not.toContain(T1);
    expect(ids).not.toContain(T2);
  });

  test("the statement's own id is not returned", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(ids).not.toContain("ST_T1");
  });

  test("a used id with no entity (GHOST tag) is filtered by the subset invariant", async () => {
    const ids = await runEdge({ entityId: T1 }, conn);
    expect(ids).not.toContain("GHOST");
    expect(ids).not.toContain("LONELY");
  });

  test("actant rows lacking classifications/identifications do not abort the query", async () => {
    const ids = await runEdge({ entityId: T_RAW }, conn);
    expect(sorted(ids)).toEqual(["RAWACTANT"]);
  });

  test("no target territory -> matches nothing", async () => {
    const ids = await runEdge({}, conn);
    expect(ids).toEqual([]);
  });

  test("an empty / unknown territory -> matches nothing", async () => {
    const ids = await runEdge({ entityId: "no-such-territory" }, conn);
    expect(ids).toEqual([]);
  });
});
