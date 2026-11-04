import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareRows } from "./rows";

test("prepareRows assigns an id to rows without one and keeps existing ids", () => {
  const rows = prepareRows([{ id: "" }, {}, { id: "keep" }] as Record<string, any>[]);
  assert.match(rows[0].id, /^[0-9a-f-]{36}$/);
  assert.match(rows[1].id, /^[0-9a-f-]{36}$/);
  assert.notEqual(rows[0].id, rows[1].id);
  assert.equal(rows[2].id, "keep");
});

test("prepareRows turns RethinkDB TIME wire objects into Dates, at any depth", () => {
  const [row] = prepareRows([
    {
      id: "a",
      when: { $reql_type$: "TIME", epoch_time: 1716815613.17, timezone: "+00:00" },
      nested: [{ t: { $reql_type$: "TIME", epoch_time: 0, timezone: "+00:00" } }],
      plain: { $reql_type$: "OTHER" },
    },
  ]);
  assert.ok(row.when instanceof Date);
  assert.equal(row.when.toISOString(), "2024-05-27T13:13:33.170Z");
  assert.ok(row.nested[0].t instanceof Date);
  assert.deepEqual(row.plain, { $reql_type$: "OTHER" });
});
