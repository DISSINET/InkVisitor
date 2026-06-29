import "ts-jest";
import { r, Connection, RDatum } from "rethinkdb-ts";
import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the I_IS: edge ("S has: in any position"), the
// building block for statement co-occurrence: every statement that references
// the target entity in any position the two entity-keyed indexes cover
// (action, actant, tag, direct territory via StatementEntities; in-statement
// prop type/value incl. nested children via StatementDataProps) must be
// returned - and nothing else. References and actant classifications/
// identifications are intentionally out of scope (no shared index) and must NOT
// match. Co-occurrence of N entities = intersection of N such edges. Creates and
// drops its OWN throwaway db, so it never touches real data. Runs only when a
// RethinkDB is reachable on DB_HOST/DB_PORT (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_statement_has_entity_edge";
const TABLE = "entities";

const T0 = "t-host"; // the territory most content statements live under
const XT = "xt"; // a territory queried directly (territory-as-position)
const X = "x"; // co-occurrence target 1
const Y = "y"; // co-occurrence target 2
const Z = "z"; // an unrelated entity

const prop = (typeId: string, valueId: string, children: any[] = []) => ({
  type: { entityId: typeId },
  value: { entityId: valueId },
  children,
});
const actant = (entityId: string, extra: any = {}) => ({
  id: `sa-${entityId}`,
  entityId,
  position: EntityEnums.Position.Subject,
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

// statements that reference X via every covered position
const S_ACTANT = statement("S_ACTANT", T0, { actants: [actant(X)] });
const S_ACTION = statement("S_ACTION", T0, { actions: [action(X)] });
const S_TAG = statement("S_TAG", T0, { tags: [X] });
const S_PTYPE = statement("S_PTYPE", T0, {
  actants: [actant("a", { props: [prop(X, "pv")] })], // X as actant-prop TYPE
});
const S_PVAL = statement("S_PVAL", T0, {
  // X as action-prop VALUE nested one level deep (exercises recursion)
  actions: [action("act", [prop("t", "v", [prop("t2", X)])])],
});
const S_BOTH = statement("S_BOTH", T0, {
  actants: [actant(X), actant(Y)],
});

// statements that must NOT match edge(X)
const S_YONLY = statement("S_YONLY", T0, { actants: [actant(Y)] });
const S_OTHER = statement("S_OTHER", T0, { actants: [actant(Z)] });
// X only as a reference resource - out of scope (references are not indexed)
const S_REFONLY = statement("S_REFONLY", T0, {
  references: [{ resource: X, value: "refval" }],
  actants: [actant(Z)],
});
// X only as an actant classification - out of scope (StatementActantsCI is not
// consulted by I_IS:)
const S_CLASSONLY = statement("S_CLASSONLY", T0, {
  actants: [actant(Z, { classifications: [{ entityId: X }] })],
});
// references XT only through its direct territory (actant is Z, not XT)
const S_TERR = statement("S_TERR", XT, { actants: [actant(Z)] });

const MATCH_X = ["S_ACTANT", "S_ACTION", "S_TAG", "S_PTYPE", "S_PVAL", "S_BOTH"];

const FIXTURES = [
  entity(X, EntityEnums.Class.Person),
  entity(Y),
  entity(Z),
  entity(XT, EntityEnums.Class.Territory),
  entity(T0, EntityEnums.Class.Territory),
  S_ACTANT,
  S_ACTION,
  S_TAG,
  S_PTYPE,
  S_PVAL,
  S_BOTH,
  S_YONLY,
  S_OTHER,
  S_REFONLY,
  S_CLASSONLY,
  S_TERR,
];

const runEdge = (
  entityId: string | undefined,
  conn: Connection,
  q = r.table(TABLE)
): Promise<string[]> => {
  const edge = getEdgeInstance({
    type: Query.EdgeType["I_IS:"],
    params: {},
    logic: Query.EdgeLogic.Positive,
    id: "e1",
    node: {
      id: "n1",
      type: Query.NodeType.E,
      operator: Query.NodeOperator.And,
      params: entityId ? { entityId } : {},
      edges: [],
    },
  });
  return edge.run(q as any).distinct().run(conn) as Promise<string[]>;
};

const sorted = (a: string[]) => [...a].sort();

describe("I_IS: edge / S has entity in any position (real ReQL)", () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await r.connect({ host: HOST, port: PORT });
    await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
    await r.dbCreate(TMP_DB).run(conn);
    conn.use(TMP_DB);
    await r.tableCreate(TABLE).run(conn);

    // StatementEntities: action ids, actant entityIds, tags, direct territory
    // (mirrors packages/database/scripts/import/indexes.ts)
    await r
      .table(TABLE)
      .indexCreate(
        DbEnums.Indexes.StatementEntities,
        function (row: RDatum) {
          return (row("data")("actions")
            .map(function (a: RDatum) {
              return a("actionId");
            })
            .add(
              row("data")("actants").map(function (a: RDatum) {
                return a("entityId");
              }) as any,
              row("data")("tags").map(function (t: RDatum) {
                return t;
              }) as any,
              r.branch(
                row("data").hasFields("territory"),
                [row("data")("territory")("territoryId")],
                []
              ) as any
            ) as any).distinct();
        },
        { multi: true }
      )
      .run(conn);

    // StatementDataProps: type/value entityIds of action & actant props, lvl3
    await r
      .table(TABLE)
      .indexCreate(
        DbEnums.Indexes.StatementDataProps,
        function (row: RDatum) {
          return (row("data")("actions").concatMap(function (a: RDatum) {
            return a("props").concatMap(function (ch1: RDatum) {
              return r
                .expr([ch1("value")("entityId"), ch1("type")("entityId")])
                .add(
                  ch1("children").concatMap(function (ch2: RDatum) {
                    return r
                      .expr([ch2("value")("entityId"), ch2("type")("entityId")])
                      .add(
                        ch2("children").concatMap(function (ch3: RDatum) {
                          return [ch3("value")("entityId"), ch3("type")("entityId")];
                        }) as any
                      );
                  }) as any
                );
            });
          }).add(
            row("data")("actants").concatMap(function (a: RDatum) {
              return a("props").concatMap(function (ch1: RDatum) {
                return r
                  .expr([ch1("value")("entityId"), ch1("type")("entityId")])
                  .add(
                    ch1("children").concatMap(function (ch2: RDatum) {
                      return r
                        .expr([ch2("value")("entityId"), ch2("type")("entityId")])
                        .add(
                          ch2("children").concatMap(function (ch3: RDatum) {
                            return [ch3("value")("entityId"), ch3("type")("entityId")];
                          }) as any
                        );
                    }) as any
                  );
              });
            }) as any
          ) as any).distinct();
        },
        { multi: true }
      )
      .run(conn);

    await r.table(TABLE).indexWait(DbEnums.Indexes.StatementEntities).run(conn);
    await r.table(TABLE).indexWait(DbEnums.Indexes.StatementDataProps).run(conn);
    await r.table(TABLE).insert(FIXTURES).run(conn);
  }, 30000);

  afterAll(async () => {
    if (conn) {
      await r.dbDrop(TMP_DB).run(conn).catch(() => undefined);
      await conn.close();
    }
  });

  test("returns every statement that references the entity in any covered position", async () => {
    const ids = await runEdge(X, conn);
    expect(sorted(ids)).toEqual(sorted(MATCH_X));
  });

  test("covers in-statement prop type and nested prop value (recursion)", async () => {
    const ids = await runEdge(X, conn);
    expect(ids).toContain("S_PTYPE"); // X as prop type
    expect(ids).toContain("S_PVAL"); // X as nested prop value
  });

  test("statements that do not reference the entity are excluded", async () => {
    const ids = await runEdge(X, conn);
    expect(ids).not.toContain("S_YONLY");
    expect(ids).not.toContain("S_OTHER");
  });

  test("references and actant classifications are out of scope (not matched)", async () => {
    const ids = await runEdge(X, conn);
    expect(ids).not.toContain("S_REFONLY");
    expect(ids).not.toContain("S_CLASSONLY");
  });

  test("the direct territory counts as a position (matches co-occurrence semantics)", async () => {
    const ids = await runEdge(XT, conn);
    expect(sorted(ids)).toEqual(["S_TERR"]);
  });

  test("co-occurrence: intersecting two entity edges yields only shared statements", async () => {
    const xIds = await runEdge(X, conn);
    const yIds = await runEdge(Y, conn);
    const both = xIds.filter((id) => yIds.includes(id));
    expect(sorted(both)).toEqual(["S_BOTH"]);
    expect(sorted(yIds)).toEqual(sorted(["S_BOTH", "S_YONLY"]));
  });

  test("subset invariant: a match absent from the incoming stream is not emitted", async () => {
    const q = r.table(TABLE).filter(function (e: RDatum) {
      return e("id").ne("S_ACTANT");
    });
    const ids = await runEdge(X, conn, q as any);
    expect(ids).not.toContain("S_ACTANT");
    expect(ids).toContain("S_ACTION");
  });

  test("no target entity -> matches nothing", async () => {
    const ids = await runEdge(undefined, conn);
    expect(ids).toEqual([]);
  });

  test("an unknown entity -> matches nothing", async () => {
    const ids = await runEdge("no-such-entity", conn);
    expect(ids).toEqual([]);
  });
});
