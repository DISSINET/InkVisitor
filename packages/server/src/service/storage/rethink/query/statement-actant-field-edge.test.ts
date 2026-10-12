import "ts-jest";
import { r, Connection } from "rethinkdb-ts";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// Runs the forward SC / SI edges against a real RethinkDB in a throwaway db of
// its own, so it never touches the configured database.
const HOST = process.env.DB_HOST || "localhost";
const PORT = Number(process.env.DB_PORT) || 28015;
const TMP_DB = "iv_test_statement_actant_field";
const TABLE = "entities";

const HERETIC = "concept-heretic";
const WITNESS = "person-witness";

const filled = (entityId: string) => ({ id: `row-${entityId}`, entityId });
const emptyRow = { id: "row-empty", entityId: "" };
const actant = (entityId: string, fields: Record<string, unknown>) => ({
  id: `sa-${entityId}`,
  entityId,
  props: [],
  ...fields,
});
const statement = (id: string, actants: unknown[]) => ({
  id,
  class: EntityEnums.Class.Statement,
  data: { actions: [], actants },
});

const FIXTURES = [
  // the subject matches; the second actant row has no field at all
  statement("S-cla-missing-field", [
    actant("p1", { classifications: [filled(HERETIC)], identifications: [] }),
    actant("p2", {}),
  ]),
  // the subject matches; the second actant has a row nobody filled in
  statement("S-cla-empty-row", [
    actant("p1", { classifications: [filled(HERETIC)], identifications: [] }),
    actant("p2", { classifications: [emptyRow], identifications: [] }),
  ]),
  statement("S-cla-only-empty", [
    actant("p1", { classifications: [emptyRow], identifications: [] }),
  ]),
  statement("S-idf-missing-field", [
    actant("p1", { classifications: [], identifications: [filled(WITNESS)] }),
    actant("p2", {}),
  ]),
  statement("S-idf-only-empty", [
    actant("p1", { classifications: [], identifications: [emptyRow] }),
  ]),
];

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

describe("statement classification / identification edges (real ReQL)", () => {
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

  test("SC finds a statement whose other actant has no classifications field", async () => {
    const ids = await runEdge(Query.EdgeType["SC"], HERETIC, conn);
    expect(ids).toContain("S-cla-missing-field");
    expect(ids).toContain("S-cla-empty-row");
  });

  test("SC without a target skips statements with only empty rows", async () => {
    const ids = await runEdge(Query.EdgeType["SC"], "", conn);
    expect(ids).toContain("S-cla-missing-field");
    expect(ids).not.toContain("S-cla-only-empty");
  });

  test("SI finds a statement whose other actant has no identifications field", async () => {
    const ids = await runEdge(Query.EdgeType["SI"], WITNESS, conn);
    expect(ids).toEqual(["S-idf-missing-field"]);
  });

  test("SI without a target skips statements with only empty rows", async () => {
    const ids = await runEdge(Query.EdgeType["SI"], "", conn);
    expect(ids).toContain("S-idf-missing-field");
    expect(ids).not.toContain("S-idf-only-empty");
  });
});
