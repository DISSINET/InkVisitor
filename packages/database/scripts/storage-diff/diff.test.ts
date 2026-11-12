import { test } from "node:test";
import assert from "node:assert/strict";
import { hasDifferences, TableReport } from "./diff";

const report = (rethink: number, postgres: number, leftOut = 0): TableReport => ({
  table: "saved_queries",
  rethink,
  postgres,
  leftOut,
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

test("rows left out of the import are not a difference", () => {
  assert.equal(hasDifferences([report(3, 2, 1)]), false);
});

test("a row missing beyond the ones left out is a difference", () => {
  assert.equal(hasDifferences([report(3, 1, 1)]), true);
});
