import { test } from "node:test";
import assert from "node:assert/strict";
import { workNames } from "./names";

const now = new Date("2026-11-12T10:15:30Z");

test("workNames derives the build and the set-aside name from the database name", () => {
  assert.deepEqual(workNames("inkvisitor", now), {
    build: "inkvisitor_migrating",
    aside: "inkvisitor_replaced_20261112101530",
  });
});

test("workNames takes the longest name PostgreSQL keeps whole", () => {
  assert.equal(workNames("x".repeat(39), now).aside.length, 63);
});

test("workNames refuses a name PostgreSQL would cut", () => {
  assert.throws(() => workNames("x".repeat(40), now), /63 bytes/);
});
