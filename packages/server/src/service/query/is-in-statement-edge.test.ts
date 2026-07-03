import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the IS: edge ("is in S: any position", aka
// XIsInS): given a target Statement S, it should return every entity USED in S
// in ANY position - action + action props, actant + its classifications /
// identifications / props, statement-level props (incl. nested children),
// reference resource / value, and tags. Entities not referenced by S, the
// statement's own id and its territory must NOT match. It creates/drops its OWN
// throwaway db, so it never touches real data. Runs only when a RethinkDB is
// reachable on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_is_in_statement_edge";
const TABLE = "entities";

// the target statement ST references one entity per position; every referenced
// id below also gets its own row so it is present in the base stream.
const ST = "s-target";
const ST2 = "s-other";
const TERR = "t-0";

const A_ACTION = "e-action";
const A_APT = "e-actprop-t";
const A_APV = "e-actprop-v";
const A_ACTANT = "e-actant";
const A_CLA = "e-classification";
const A_IDE = "e-identification";
const A_ANPT = "e-actantprop-t";
const A_ANPV = "e-actantprop-v";
const A_PT = "e-prop-t";
const A_PV = "e-prop-v";
const A_PT_C = "e-prop-t-child";
const A_PV_C = "e-prop-v-child";
const A_RES = "e-ref-resource";
const A_RVAL = "e-ref-value";
const A_TAG = "e-tag";
const A_CTRL = "e-not-in-statement";
const A_OTHER = "e-other-actant";

const USED = [
  A_ACTION,
  A_APT,
  A_APV,
  A_ACTANT,
  A_CLA,
  A_IDE,
  A_ANPT,
  A_ANPV,
  A_PT,
  A_PV,
  A_PT_C,
  A_PV_C,
  A_RES,
  A_RVAL,
  A_TAG,
];

const prop = (typeId: string, valueId: string, children: any[] = []) => ({
  type: { entityId: typeId },
  value: { entityId: valueId },
  children,
});

const ent = (id: string) => ({ id, class: EntityEnums.Class.Person });

const targetStatement = {
  id: ST,
  class: EntityEnums.Class.Statement,
  props: [prop(A_PT, A_PV, [prop(A_PT_C, A_PV_C)])],
  references: [{ resource: A_RES, value: A_RVAL }],
  data: {
    territory: { territoryId: TERR, order: 1 },
    actions: [{ actionId: A_ACTION, props: [prop(A_APT, A_APV)] }],
    actants: [
      {
        entityId: A_ACTANT,
        position: EntityEnums.Position.Subject,
        props: [prop(A_ANPT, A_ANPV)],
        classifications: [{ entityId: A_CLA }],
        identifications: [{ entityId: A_IDE }],
      },
    ],
    tags: [A_TAG],
  },
};

// a second, unrelated statement whose entity must never leak into IS: of ST
const otherStatement = {
  id: ST2,
  class: EntityEnums.Class.Statement,
  props: [],
  references: [],
  data: {
    territory: { territoryId: TERR, order: 1 },
    actions: [],
    actants: [
      {
        entityId: A_OTHER,
        position: EntityEnums.Position.Subject,
        props: [],
        classifications: [],
        identifications: [],
      },
    ],
    tags: [],
  },
};

const FIXTURES = [
  targetStatement,
  otherStatement,
  { id: TERR, class: EntityEnums.Class.Territory, data: { parent: false } },
  ...USED.map(ent),
  ent(A_CTRL),
  ent(A_OTHER),
];

const runEdge = async (
  params: Query.INodeParams,
  conn: Connection
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["IS:"],
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
  return edge.run(r.table(TABLE)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("IS: edge / is in S: any position (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(TABLE).run(conn);
    await r.table(TABLE).insert(FIXTURES).run(conn);
  }, 30000);

  afterAll(async () => {
    if (conn) {
      await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
      await conn.close();
    }
  });

  test("returns every entity used in the target S across all positions (incl. nested prop children)", async () => {
    const ids = await runEdge({ entityId: ST }, conn);
    expect(sorted(ids)).toEqual(sorted(USED));
  });

  test("excludes entities not referenced by the statement", async () => {
    const ids = await runEdge({ entityId: ST }, conn);
    expect(ids).not.toContain(A_CTRL);
  });

  test("does not leak entities from a different statement", async () => {
    const ids = await runEdge({ entityId: ST }, conn);
    expect(ids).not.toContain(A_OTHER);
  });

  test("does not return the statement itself or its territory", async () => {
    const ids = await runEdge({ entityId: ST }, conn);
    expect(ids).not.toContain(ST);
    expect(ids).not.toContain(TERR);
  });

  test("no target statement -> matches nothing", async () => {
    const ids = await runEdge({}, conn);
    expect(ids).toEqual([]);
  });

  test("an unknown statement -> matches nothing", async () => {
    const ids = await runEdge({ entityId: "no-such-statement" }, conn);
    expect(ids).toEqual([]);
  });

  test("a non-statement target id -> matches nothing", async () => {
    const ids = await runEdge({ entityId: TERR }, conn);
    expect(ids).toEqual([]);
  });
});
