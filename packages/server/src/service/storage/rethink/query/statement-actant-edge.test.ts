import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Verifies the ACTUAL ReQL of the inverse in-statement actant-role edges
// (I_IS:S / I_IS:A1 / I_IS:A2 - "S has: subject / actant1 / actant2") against a
// real RethinkDB. It creates/drops its OWN throwaway db, so it never touches
// real data. Runs only when a RethinkDB is reachable on DB_HOST/DB_PORT
// (defaults localhost:28015).
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_statement_actant_edge";
const TABLE = "entities";

// substatements (themselves Statements) referenced as actants
const SUB1 = "sub-1";
const SUB2 = "sub-2";
// a non-statement actant
const P1 = "p-1";

const entity = (id: string, cls: EntityEnums.Class, extra: any = {}) => ({
  id,
  class: cls,
  ...extra,
});
const actant = (entityId: string, position: EntityEnums.Position) => ({
  id: `sa-${entityId}-${position}`,
  entityId,
  position,
});
const statement = (id: string, actants: any[] = []) =>
  entity(id, EntityEnums.Class.Statement, { data: { actions: [], actants } });

const FIXTURES = [
  // substatements + a plain person actant
  statement(SUB1),
  statement(SUB2),
  entity(P1, EntityEnums.Class.Person),
  // statements referencing a substatement in each role
  statement("ST_S_SUB", [actant(SUB1, EntityEnums.Position.Subject)]),
  statement("ST_A1_SUB", [actant(SUB1, EntityEnums.Position.Actant1)]),
  statement("ST_A2_SUB", [actant(SUB1, EntityEnums.Position.Actant2)]),
  // subject is a non-statement (Person) -> not a chain
  statement("ST_S_PERSON", [actant(P1, EntityEnums.Position.Subject)]),
  // substatement only in the pseudoactant role -> excluded from s/a1/a2
  statement("ST_PA_SUB", [actant(SUB1, EntityEnums.Position.PseudoActant)]),
  // no actants
  statement("ST_PLAIN", []),
  // subject points at a non-existent entity -> null-safe, no class match
  statement("ST_DANGLING", [actant("missing-x", EntityEnums.Position.Subject)]),
];

const runEdge = (
  type: Query.EdgeType,
  params: Query.INodeParams,
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
      params,
      edges: [],
    },
  });
  return edge.run(r.table(TABLE)).distinct().run(conn) as Promise<string[]>;
};

const STATEMENT = [EntityEnums.Class.Statement];
const sorted = (a: string[]) => [...a].sort();

describe("inverse in-statement actant-role edges (real ReQL)", () => {
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

  test("I_IS:S + class Statement -> statements whose SUBJECT is a substatement", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_IS:S"],
      { entityClasses: STATEMENT },
      conn
    );
    expect(sorted(ids)).toEqual(["ST_S_SUB"]);
  });

  test("I_IS:A1 + class Statement -> only the actant1 chain", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_IS:A1"],
      { entityClasses: STATEMENT },
      conn
    );
    expect(sorted(ids)).toEqual(["ST_A1_SUB"]);
  });

  test("I_IS:A2 + class Statement -> only the actant2 chain", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_IS:A2"],
      { entityClasses: STATEMENT },
      conn
    );
    expect(sorted(ids)).toEqual(["ST_A2_SUB"]);
  });

  test("pseudoactant role is excluded from s/a1/a2", async () => {
    for (const type of [
      Query.EdgeType["I_IS:S"],
      Query.EdgeType["I_IS:A1"],
      Query.EdgeType["I_IS:A2"],
    ]) {
      const ids = await runEdge(type, { entityClasses: STATEMENT }, conn);
      expect(ids).not.toContain("ST_PA_SUB");
    }
  });

  test("a non-statement subject (Person) is not a chain", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_IS:S"],
      { entityClasses: STATEMENT },
      conn
    );
    expect(ids).not.toContain("ST_S_PERSON");
  });

  test("target by specific entity id matches that exact actant reference", async () => {
    expect(
      sorted(await runEdge(Query.EdgeType["I_IS:S"], { entityId: P1 }, conn))
    ).toEqual(["ST_S_PERSON"]);
    expect(
      sorted(await runEdge(Query.EdgeType["I_IS:S"], { entityId: SUB1 }, conn))
    ).toEqual(["ST_S_SUB"]);
  });

  test("no target -> any statement with an actant in that role", async () => {
    const ids = await runEdge(Query.EdgeType["I_IS:S"], {}, conn);
    // every statement that has *some* subject actant, regardless of its class
    expect(sorted(ids)).toEqual(
      sorted(["ST_S_SUB", "ST_S_PERSON", "ST_DANGLING"])
    );
  });

  test("dangling actant entity id is null-safe and never class-matches", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_IS:S"],
      { entityClasses: STATEMENT },
      conn
    );
    expect(ids).not.toContain("ST_DANGLING");
  });

  test("substatements themselves are not returned (no qualifying actant)", async () => {
    const ids = await runEdge(
      Query.EdgeType["I_IS:S"],
      { entityClasses: STATEMENT },
      conn
    );
    expect(ids).not.toContain(SUB1);
    expect(ids).not.toContain(SUB2);
  });
});
