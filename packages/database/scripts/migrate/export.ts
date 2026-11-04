import { once } from "events";
import { createWriteStream } from "fs";
import { r, Connection } from "rethinkdb-ts";

/**
 * Writes `rows` to `file` as a JSON array with one document per line, holding
 * one document at a time. Returns how many were written.
 */
export async function writeJsonArray(rows: AsyncIterable<unknown>, file: string): Promise<number> {
  const out = createWriteStream(file, { encoding: "utf8" });
  const write = async (chunk: string): Promise<void> => {
    if (!out.write(chunk)) {
      await once(out, "drain");
    }
  };
  let count = 0;
  await write("[");
  for await (const row of rows) {
    await write(`${count ? ",\n" : "\n"}${JSON.stringify(row)}`);
    count++;
  }
  await write("\n]\n");
  out.end();
  await once(out, "finish");
  return count;
}

/**
 * Every document of `table` in primary key order, in the wire form
 * `rethinkdb export` writes: TIME and BINARY values stay `$reql_type$`
 * objects, so the file reads back through the seeder like an official dump.
 */
export async function exportTable(conn: Connection, table: string, file: string): Promise<number> {
  const cursor = await r
    .table(table)
    .orderBy({ index: "id" })
    .getCursor(conn, { timeFormat: "raw", binaryFormat: "raw" });
  return writeJsonArray(cursor, file);
}
