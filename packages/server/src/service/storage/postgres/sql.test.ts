import { DbEnums } from "@inkvisitor/shared/enums";
import { collect, propPaths } from "./provision";
import { Params, arr, encode, indexHolds, indexPredicate, revive } from "./sql";

describe("postgres sql helpers", () => {
  it("encodes documents as JSON with dates as ISO strings and without NUL", () => {
    const text = encode({ d: new Date("2024-03-02T00:00:00.000Z"), s: "a\u0000b" });
    expect(text).toBe('{"d":"2024-03-02T00:00:00.000Z","s":"ab"}');
    expect(JSON.parse(encode({ s: "a\\u0000b" }))).toEqual({ s: "a\\u0000b" });
  });

  it("revives the date fields of a table and leaves other strings alone", () => {
    const audit = revive<{ date: Date; user: string }>("audits", {
      date: "2024-03-02T00:00:00.000Z",
      user: "2024-03-02T00:00:00.000Z",
    });
    expect(audit.date).toBeInstanceOf(Date);
    expect(audit.date.toISOString()).toBe("2024-03-02T00:00:00.000Z");
    expect(typeof audit.user).toBe("string");
    expect(revive<{ lastUpdated: Date }>("stats_materialized_day", { lastUpdated: "2024-01-01T00:00:00.000Z" }).lastUpdated).toBeInstanceOf(Date);
    expect(revive<{ deletedAt?: unknown }>("users", { deletedAt: null }).deletedAt).toBeNull();
  });

  it("builds a single btree predicate with ANY", () => {
    expect(indexPredicate("entities", DbEnums.Indexes.Class, ["C", "P"])).toEqual({
      sql: "(doc->>'class') = ANY($1::text[])",
      params: [["C", "P"]],
    });
  });

  it("builds a compound btree predicate with one tuple per key", () => {
    expect(
      indexPredicate("audits", DbEnums.Indexes.AuditScopeModelId, [["entity", "e1"], ["document", null]], 1)
    ).toEqual({
      sql: "((doc->>'auditScope'), (doc->>'modelId')) IN (($2, $3), ($4, $5))",
      params: ["entity", "e1", "document", null],
    });
  });

  it("builds a gin predicate with the key function", () => {
    expect(indexPredicate("documents", DbEnums.Indexes.DocumentEntityIds, ["e1"])).toEqual({
      sql: "documents_entityids(doc) && $1::text[]",
      params: [["e1"]],
    });
  });

  it("rejects an unknown index", () => {
    expect(() => indexPredicate("users", "nope", ["x"])).toThrow(/users\.nope/);
  });

  it("returns a never-matching predicate for an empty key list", () => {
    expect(indexPredicate("audits", DbEnums.Indexes.AuditScopeModelId, [])).toEqual({
      sql: "FALSE",
      params: [],
    });
    expect(indexPredicate("documents", DbEnums.Indexes.DocumentEntityIds, [])).toEqual({
      sql: "FALSE",
      params: [],
    });
  });

  it("rejects a compound key with the wrong number of components", () => {
    expect(() => indexPredicate("audits", DbEnums.Indexes.AuditScopeModelId, [["entity"]])).toThrow(
      /expects 2 key components, got 1/
    );
  });

  it("indexHolds builds the join form for gin and single btree indexes", () => {
    expect(indexHolds("entities", DbEnums.Indexes.StatementEntities, "e.id")).toBe(
      "entities_statement_entities(doc) @> ARRAY[e.id]"
    );
    expect(indexHolds("entities", DbEnums.Indexes.StatementTerritory, "e.id")).toBe(
      "(doc->'data'->'territory'->>'territoryId') = e.id"
    );
  });

  it("indexHolds rejects a compound index and an unknown one", () => {
    expect(() => indexHolds("audits", DbEnums.Indexes.AuditScopeModelId, "e.id")).toThrow(/cannot be joined/);
    expect(() => indexHolds("users", "nope", "e.id")).toThrow(/users\.nope/);
  });

  it("Params numbers placeholders in order and appends the params of an index predicate", () => {
    const p = new Params();
    expect(p.add("x")).toBe("$1");
    expect(p.index("entities", DbEnums.Indexes.Class, ["C"])).toBe("(doc->>'class') = ANY($2::text[])");
    expect(p.add(3)).toBe("$3");
    expect(p.list).toEqual(["x", ["C"], 3]);
  });

  it("arr yields the array itself or an empty one", () => {
    expect(arr("doc->'x'")).toBe("CASE WHEN jsonb_typeof(doc->'x') = 'array' THEN doc->'x' ELSE '[]'::jsonb END");
  });

  it("propPaths follows children and keeps one side on request; collect reads the given document", () => {
    expect(propPaths("$.p[*]", 2)).toEqual([
      "$.p[*].value.entityId",
      "$.p[*].type.entityId",
      "$.p[*].children[*].value.entityId",
      "$.p[*].children[*].type.entityId",
    ]);
    expect(propPaths("$.p[*]", 1, "type")).toEqual(["$.p[*].type.entityId"]);
    expect(collect(["$.a[*]"], "v IS NOT NULL", "s.doc")).toContain("jsonb_path_query_array(s.doc, '$.a[*]', '{}', true)");
    expect(collect(["$.a[*]"])).toContain("jsonb_path_query_array(doc, '$.a[*]', '{}', true)");
  });
});
