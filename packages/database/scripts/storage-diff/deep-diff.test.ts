import { test } from "node:test";
import assert from "node:assert/strict";
import { firstDifference, normalize } from "./deep-diff";

test("normalize turns Dates into ISO strings, sorts keys and drops undefined", () => {
  assert.deepEqual(normalize({ b: new Date(0), a: [1, { z: 1, y: undefined }] }), {
    a: [1, { z: 1 }],
    b: "1970-01-01T00:00:00.000Z",
  });
});

test("firstDifference names the first differing path", () => {
  assert.equal(firstDifference({ a: [1, 2] }, { a: [1, 2] }), null);
  assert.equal(firstDifference({ a: [1, 2] }, { a: [2, 1] }), "$.a[0]");
  assert.equal(firstDifference({ a: [1] }, { a: [1, 2] }), "$.a.length");
  assert.equal(firstDifference({ a: 1 }, { a: 1, b: 2 }), "$.b");
  assert.equal(firstDifference({ a: { b: [] } }, { a: { b: {} } }), "$.a.b");
  assert.equal(firstDifference(null, {}), "$");
});

test("ISO timestamps within one millisecond are equal", () => {
  assert.equal(firstDifference("2024-05-27T13:13:33.170Z", "2024-05-27T13:13:33.169Z"), null);
  assert.equal(firstDifference("2024-05-27T13:13:33.170Z", "2024-05-27T13:13:33.168Z"), "$");
  assert.equal(firstDifference("not a date", "not a date "), "$");
});
