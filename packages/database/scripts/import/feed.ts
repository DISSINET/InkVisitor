import colors from "colors/safe";
import * as fs from "fs";
import { createReadStream } from "fs";
import { TableSchema } from "./common";
import { prepareRows } from "./rows";
import { InsertResult, SeedTarget } from "./target";

const StreamArray = require("stream-json/streamers/StreamArray.js") as {
  withParser: (opts?: unknown) => NodeJS.ReadWriteStream;
};

const BATCH = 500;

export const noRows = (): InsertResult => ({
  inserted: 0,
  duplicates: 0,
  failed: 0,
});

export const addCounts = (a: InsertResult, b: InsertResult): InsertResult => ({
  inserted: a.inserted + b.inserted,
  duplicates: a.duplicates + b.duplicates,
  failed: a.failed + b.failed,
});

/**
 * Writes one batch to every target and returns what each one stored, in target
 * order. Rows are prepared once (ids, dates) so every target stores the same
 * row. A batch that throws is retried row by row so one bad row costs one row,
 * not the batch; a row that throws on its own is counted as failed. The
 * RethinkDB driver reports a per-row write failure in the result rather than
 * by throwing, which is why the counts come from what each insert returns.
 */
async function writeBatch(
  targets: SeedTarget[],
  table: TableSchema,
  rows: Record<string, unknown>[]
): Promise<InsertResult[]> {
  prepareRows(rows);
  const counts: InsertResult[] = [];
  for (const target of targets) {
    try {
      counts.push(await target.insert(table, rows));
    } catch (e) {
      console.error(
        colors.red(
          `\n${target.kind}: batch failed (${e instanceof Error ? e.message : e}), retrying row by row`
        )
      );
      let total = noRows();
      for (const row of rows) {
        try {
          total = addCounts(total, await target.insert(table, [row]));
        } catch {
          console.log(colors.gray(`    ${target.kind}: skipping record ${row.id}`));
          total.failed++;
        }
      }
      counts.push(total);
    }
  }
  return counts;
}

/** feeds `onBatch` with up to BATCH rows at a time from a JSON array file, never loading the whole file */
export function streamFile(
  file: string,
  onBatch: (rows: Record<string, unknown>[]) => Promise<void>
): Promise<void> {
  return new Promise((resolve, reject) => {
    let batch: Record<string, unknown>[] = [];
    let pending: Promise<void> = Promise.resolve();
    const pipeline = createReadStream(file).pipe(StreamArray.withParser());
    pipeline.on("data", ({ value }: { value: Record<string, unknown> }) => {
      batch.push(value);
      if (batch.length >= BATCH) {
        const rows = batch;
        batch = [];
        pipeline.pause();
        pending = pending
          .then(() => onBatch(rows))
          .then(() => {
            pipeline.resume();
          })
          .catch((e) => {
            pipeline.emit("error", e);
          });
      }
    });
    pipeline.on("end", () => {
      pending
        .then(() => onBatch(batch))
        .then(resolve)
        .catch(reject);
    });
    pipeline.on("error", reject);
  });
}

/**
 * Imports one table into every target and returns what each one stored, in
 * target order. Loaded data goes through the table's transform once and is
 * batched; a table that only has a file path is streamed and transformed batch
 * by batch.
 */
export async function feedTable(
  targets: SeedTarget[],
  table: TableSchema,
  dataFilePath: string | null
): Promise<InsertResult[]> {
  const name = table.tableName;
  let totals = targets.map(noRows);
  const record = (counts: InsertResult[]) => {
    totals = totals.map((total, i) => addCounts(total, counts[i]));
  };
  if (Array.isArray(table.data)) {
    if (table.transform) {
      table.transform();
    }
    const rows = table.data as Record<string, unknown>[];
    console.log(colors.cyan(`Importing ${rows.length} entries to table ${name}...`));
    for (let start = 0; start < rows.length; start += BATCH) {
      record(await writeBatch(targets, table, rows.slice(start, start + BATCH)));
      const done = Math.min(100, ((start + BATCH) / rows.length) * 100);
      process.stdout.write(`Importing ${name}: ${done.toFixed(2)}%\r`);
    }
  } else if (dataFilePath) {
    const mb = (fs.statSync(dataFilePath).size / 1024 / 1024).toFixed(1);
    console.log(colors.cyan(`Importing ${name} from ${dataFilePath} (${mb} MB, streamed)...`));
    await streamFile(dataFilePath, async (rows) => {
      if (table.transform) {
        const scoped = { ...table, data: rows };
        scoped.transform!();
        rows = scoped.data;
      }
      record(await writeBatch(targets, table, rows));
    });
  } else {
    console.log(colors.gray(`Skipping ${name} - no data configured`));
    return totals;
  }
  for (const [i, target] of targets.entries()) {
    console.log(colors.green(`\n${target.kind}: ${await target.count(table)} rows in ${name}`));
    if (totals[i].duplicates) {
      console.log(
        colors.yellow(`${target.kind}: ${totals[i].duplicates} duplicate ids skipped in ${name}`)
      );
    }
    if (totals[i].failed) {
      console.log(colors.red(`${target.kind}: ${totals[i].failed} rows dropped in ${name}`));
    }
  }
  return totals;
}
