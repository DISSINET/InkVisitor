import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { writeJsonArray } from "./export";

async function* rows(items: unknown[]): AsyncGenerator<unknown> {
  for (const item of items) {
    yield item;
  }
}

const tmpFile = (): string =>
  path.join(fs.mkdtempSync(path.join(os.tmpdir(), "iv-export-")), "table.json");

test("writeJsonArray writes one document per line and keeps TIME wire objects", async () => {
  const file = tmpFile();
  const docs = [
    { id: "a", when: { $reql_type$: "TIME", epoch_time: 1716815613.17, timezone: "+00:00" } },
    { id: "b", nested: [{ x: null }], text: "line\nbreak" },
  ];
  assert.equal(await writeJsonArray(rows(docs), file), 2);
  const text = fs.readFileSync(file, "utf8");
  assert.equal(text, `[\n${JSON.stringify(docs[0])},\n${JSON.stringify(docs[1])}\n]\n`);
  assert.deepEqual(JSON.parse(text), docs);
});

test("writeJsonArray writes an empty array for a table without rows", async () => {
  const file = tmpFile();
  assert.equal(await writeJsonArray(rows([]), file), 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), []);
});
