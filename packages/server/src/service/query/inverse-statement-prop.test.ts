import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// This suite verifies the ACTUAL ReQL of the inverse in-statement edges against
// a real RethinkDB. It deliberately ignores the configured DB (DB_NAME points
// at the live `inkvisitor` database) and creates/drops its OWN throwaway db, so
// it can never touch real data. It only runs when a RethinkDB is reachable on
// DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_inverse_statement_prop";
const TABLE = "entities";

// --- concept ids (characteristics) ---
const CAT = "concept-social-category"; // a property TYPE concept
const WOMAN = "concept-woman"; // a property VALUE concept
const MONK = "concept-monk";
const HERETIC = "concept-heretic";

// --- person ids ---
const P_WOMAN_INSTMT = "p-woman-instmt"; // woman via in-statement prop value
const P_MONK_META = "p-monk-meta"; // monk via entity meta-prop only
const P_PLAIN = "p-plain"; // no characterization
const P_INSTMT_A = "p-instmt-a"; // carries the woman prop in a 2-actant stmt
const P_INSTMT_B = "p-instmt-b"; // co-actant in the same stmt WITHOUT the prop
const P_HERETIC_CLASS = "p-heretic-class"; // heretic via in-statement classification

// only fields the queries/indexes actually read are populated
const spec = (entityId: string) => ({ entityId });
const prop = (typeId: string, valueId: string, children: any[] = []) => ({
  id: `prop-${typeId}-${valueId}`,
  type: spec(typeId),
  value: spec(valueId),
  children,
});
const actant = (entityId: string, props: any[] = [], classifications: any[] = []) => ({
  id: `sa-${entityId}`,
  entityId,
  props,
  classifications,
  identifications: [],
});
const entity = (id: string, cls: EntityEnums.Class, extra: any = {}) => ({
  id,
  class: cls,
  ...extra,
});
const statement = (id: string, actants: any[], actions: any[] = []) =>
  entity(id, EntityEnums.Class.Statement, { data: { actions, actants } });

const FIXTURES = [
  entity(CAT, EntityEnums.Class.Concept),
  entity(WOMAN, EntityEnums.Class.Concept),
  entity(MONK, EntityEnums.Class.Concept),
  entity(HERETIC, EntityEnums.Class.Concept),
  entity(P_PLAIN, EntityEnums.Class.Person, { props: [] }),
  entity(P_MONK_META, EntityEnums.Class.Person, { props: [prop(CAT, MONK)] }),
  // the actant persons must exist as entities - the edge intersects matches
  // with the base stream (the subset invariant), so it never invents ids
  entity(P_WOMAN_INSTMT, EntityEnums.Class.Person, { props: [] }),
  entity(P_INSTMT_A, EntityEnums.Class.Person, { props: [] }),
  entity(P_INSTMT_B, EntityEnums.Class.Person, { props: [] }),
  entity(P_HERETIC_CLASS, EntityEnums.Class.Person, { props: [] }),
  // P_WOMAN_INSTMT is an actant carrying a prop type=CAT value=WOMAN
  statement("S1", [actant(P_WOMAN_INSTMT, [prop(CAT, WOMAN)])]),
  // two actants, only A carries the woman prop - B must NOT match
  statement("S2", [
    actant(P_INSTMT_A, [prop(CAT, WOMAN)]),
    actant(P_INSTMT_B, []),
  ]),
  // heretic expressed as an in-statement classification on the actant
  statement("S3", [actant(P_HERETIC_CLASS, [], [{ id: "cl1", entityId: HERETIC }])]),
];

// mirror of the two index definitions this code relies on (packages/database/
// scripts/import/indexes.ts) - only the ones the inverse edges query
const createIndexes = async (conn: Connection) => {
  await r
    .table(TABLE)
    .indexCreate(
      DbEnums.Indexes.StatementDataProps,
      function (row: any) {
        const walk = (props: any) =>
          props.concatMap((ch1: any) =>
            r.expr([ch1("value")("entityId"), ch1("type")("entityId")]).add(
              ch1("children").concatMap((ch2: any) =>
                r.expr([ch2("value")("entityId"), ch2("type")("entityId")]).add(
                  ch2("children").concatMap((ch3: any) => [
                    ch3("value")("entityId"),
                    ch3("type")("entityId"),
                  ]) as any
                )
              ) as any
            )
          );
        return (
          walk(row("data")("actions").concatMap((a: any) => a("props"))).add(
            walk(
              row("data")("actants").concatMap((a: any) => a("props"))
            ) as any
          ) as any
        ).distinct();
      },
      { multi: true }
    )
    .run(conn);

  await r
    .table(TABLE)
    .indexCreate(
      DbEnums.Indexes.StatementActantsCI,
      function (row: any) {
        return row("data")("actants")
          .concatMap(function (a: any) {
            return r
              .branch(
                a.hasFields("classifications"),
                a("classifications").map((c: any) => c("entityId")),
                []
              )
              .add(
                r.branch(
                  a.hasFields("identifications"),
                  a("identifications").map((i: any) => i("entityId")),
                  []
                ) as any
              );
          })
          .distinct();
      },
      { multi: true }
    )
    .run(conn);

  await r.table(TABLE).indexWait().run(conn);
};

const runEdge = (
  type: Query.EdgeType,
  targetEntityId: string,
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
      params: { entityId: targetEntityId },
      edges: [],
    },
  });
  return edge.run(r.table(TABLE)).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("inverse in-statement prop/classification edges (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(TABLE).run(conn);
    await createIndexes(conn);
    await r.table(TABLE).insert(FIXTURES).run(conn);
  }, 30000);

  afterAll(async () => {
    if (conn) {
      await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
      await conn.close();
    }
  });

  test("I_SP:V emits the actant entity (the person), not the statement", async () => {
    const ids = await runEdge(Query.EdgeType["I_SP:V"], WOMAN, conn);
    expect(ids).toContain(P_WOMAN_INSTMT);
    expect(ids).not.toContain("S1");
    expect(ids).not.toContain("S2");
  });

  test("I_SP:V keeps actant linkage: only the actant carrying the prop matches", async () => {
    const ids = await runEdge(Query.EdgeType["I_SP:V"], WOMAN, conn);
    expect(ids).toContain(P_INSTMT_A);
    expect(ids).not.toContain(P_INSTMT_B);
  });

  test("I_SP:V over WOMAN returns exactly the in-statement women, not meta-prop people", async () => {
    const ids = await runEdge(Query.EdgeType["I_SP:V"], WOMAN, conn);
    expect(sorted(ids)).toEqual(sorted([P_WOMAN_INSTMT, P_INSTMT_A]));
    expect(ids).not.toContain(P_MONK_META);
  });

  test("I_SP:T matches by prop TYPE; I_SP:V does not match a type-only concept", async () => {
    const byType = await runEdge(Query.EdgeType["I_SP:T"], CAT, conn);
    expect(sorted(byType)).toEqual(sorted([P_WOMAN_INSTMT, P_INSTMT_A]));

    const byValue = await runEdge(Query.EdgeType["I_SP:V"], CAT, conn);
    expect(byValue).toEqual([]);
  });

  test("I_SC matches the actant characterised by an in-statement classification", async () => {
    const ids = await runEdge(Query.EdgeType["I_SC"], HERETIC, conn);
    expect(sorted(ids)).toEqual(sorted([P_HERETIC_CLASS]));
  });
});
