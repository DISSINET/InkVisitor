import { test } from "node:test";
import assert from "node:assert/strict";
import { hasDifferences, TableReport } from "./diff";

const report = (rethink: number, postgres: number): TableReport => ({
  table: "saved_queries",
  rethink,
  postgres,
  missingInPg: 0,
  extraInPg: 0,
  differing: 0,
  examples: { missing: [], extra: [], differing: [] },
  indexes: [],
});

test("a table absent in RethinkDB matches an empty PostgreSQL table", () => {
  assert.equal(hasDifferences([report(-1, 0)]), false);
});

test("a table absent in RethinkDB differs from a PostgreSQL table with rows", () => {
  assert.equal(hasDifferences([report(-1, 3)]), true);
});
