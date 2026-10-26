import { test } from "node:test";
import assert from "node:assert/strict";
import { compareKeys, normalizeKeys } from "./index-keys";

test("a multi index holds the sorted unique non-null components", () => {
  assert.deepEqual(normalizeKeys(["b", "a", "a"], true), ["a", "b"]);
  assert.deepEqual(normalizeKeys(["b", null, "a"], true), ["a", "b"]);
  assert.equal(normalizeKeys([], true), null);
  assert.equal(normalizeKeys([null], true), null);
  assert.deepEqual(normalizeKeys([new Date(0)], true), [
    "1970-01-01T00:00:00.000Z",
  ]);
});

test("every other index holds one key, a scalar or a tuple in declaration order", () => {
  assert.deepEqual(normalizeKeys(["z", 1], false), ["z", "1"]);
  assert.equal(normalizeKeys(["z", null], false), null);
  assert.equal(normalizeKeys(5, false), "5");
  assert.equal(normalizeKeys(new Date(0), false), "1970-01-01T00:00:00.000Z");
});

test("only a rethinkdb key function that raised counts as lenient", () => {
  assert.equal(compareKeys(["x"], ["x"], true).verdict, "equal");
  assert.equal(compareKeys(null, null, true).verdict, "equal");
  // .default(null) on a function that raised, against keys postgres did read
  assert.equal(compareKeys(null, ["x"], true).verdict, "lenient");
  // a function that ran and produced no keys is a real difference
  assert.equal(compareKeys([], ["x"], true).verdict, "differing");
  assert.equal(compareKeys(["x"], [], true).verdict, "differing");
});

test("an index over a reference column takes rethinkdb's empty id as no key", () => {
  assert.equal(compareKeys("", null, false, true).verdict, "equal");
  assert.equal(compareKeys("", "t1", false, true).verdict, "differing");
  assert.equal(compareKeys("", null, false).verdict, "differing");
});

test("a comparison carries the normalized values it compared", () => {
  assert.deepEqual(compareKeys(["b", "a"], ["a"], true), {
    verdict: "differing",
    rethink: ["a", "b"],
    postgres: ["a"],
  });
});
