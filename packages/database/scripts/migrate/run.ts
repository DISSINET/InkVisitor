import colors from "colors/safe";
import * as fs from "fs";
import * as path from "path";
import { r } from "rethinkdb-ts";
import { TABLES } from "@service/storage/postgres/provision";
import { flag, has, TableSchema } from "../import/common";
import { DATASETS_DIR, dataFilePath, prepareRawDataset } from "../import/datasets";
import { addCounts, feedTable, noRows, streamFile } from "../import/feed";
import { PostgresTarget } from "../import/targets/postgres";
import { RethinkTarget } from "../import/targets/rethinkdb";
import { diffDatabases, hasDifferences, lenientCount, printReports } from "../storage-diff/diff";
import { KEEP_FIRST, planSkips, skippedIds } from "./duplicates";
import { exportTable, writeJsonArray } from "./export";
import { workNames } from "./names";
import { checkConstraints, RowSource } from "./preflight";

/**
 * Moves one RethinkDB database into PostgreSQL: every catalogue table is
 * exported into datasets/<out>/<table>.json, the export is checked against
 * the PostgreSQL constraints, the PostgreSQL database is created with the
 * schema, the export is imported through the seeder and the two databases are
 * diffed. The database and the export take their names when every check
 * passed; a database replaced with --replace is renamed and kept. RethinkDB is
 * only read. --skip-duplicates imports a database whose duplicate relations
 * and acl_permissions rows are not removed yet.
 *   pnpm migrate --db=<name> [--pg=<name>] [--out=<dir>] [--replace] [--no-diff] [--skip-duplicates] [env]
 */
const USAGE = "usage: migrate --db=<name> [--pg=<name>] [--out=<dir>] [--replace] [--no-diff] [--skip-duplicates] [env]";

const FLAGS = ["db", "pg", "out", "replace", "no-diff", "skip-duplicates"];

/** a mistyped flag must not fall through to a default that names another database */
function assertKnownFlags(): void {
  const unknown = process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => arg.slice(2).split("=")[0])
    .filter((name) => !FLAGS.includes(name));
  if (unknown.length) {
    throw new Error(`unknown flag --${unknown.join(", --")}\n${USAGE}`);
  }
}

const seconds = (since: number): string => ((Date.now() - since) / 1000).toFixed(1);

async function main(): Promise<void> {
  assertKnownFlags();
  const dbName = flag("db");
  if (!dbName) {
    throw new Error(USAGE);
  }
  const pgName = flag("pg") ?? dbName;
  if (!pgName) {
    throw new Error(`--pg needs a name\n${USAGE}`);
  }
  const out =
    flag("out") ?? `export-${dbName}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
  // the prefix keeps the export git-ignored and apart from the committed datasets
  if (!/^export-[\w.-]+$/.test(out)) {
    throw new Error(`--out must be a plain name starting with export-, got "${out}"`);
  }
  const dir = path.join(DATASETS_DIR, out);
  // the export and the database carry these names until every check passed, so a
  // run that stops halfway leaves datasets/<out> and the database <pg> as they were
  const buildOut = `${out}-migrating`;
  const buildDir = path.join(DATASETS_DIR, buildOut);
  const names = workNames(pgName, new Date());
  const started = Date.now();
  let building = false;
  let promoted = false;

  const rethink = new RethinkTarget();
  const postgres = new PostgresTarget();
  await rethink.connect();
  await postgres.connect();
  try {
    if (!(await rethink.dbList()).includes(dbName)) {
      throw new Error(`RethinkDB database ${dbName} does not exist`);
    }
    rethink.useDb(dbName);
    const existing = await postgres.dbList();
    const taken = existing.includes(pgName);
    if (taken && !has("replace")) {
      throw new Error(`PostgreSQL database ${pgName} exists, pass --replace to replace it`);
    }
    if (taken) {
      // a connection follows a renamed database, so a running API would keep writing into the replaced one
      const open = await postgres.connections(pgName);
      if (open) {
        throw new Error(`PostgreSQL database ${pgName} has ${open} open connection${open === 1 ? "" : "s"}, stop the API before replacing it`);
      }
    }
    postgres.useDb(names.build);

    const conn = rethink.getConnection();
    const present = (await r.tableList().run(conn)) as string[];
    // the directory belongs to this run; a file left by an earlier run would be imported too
    fs.rmSync(buildDir, { recursive: true, force: true });
    fs.mkdirSync(buildDir, { recursive: true });
    const exported = new Map<string, number>();
    for (const table of Object.keys(TABLES)) {
      if (!present.includes(table)) {
        console.log(colors.gray(`${table}: not in RethinkDB, skipped`));
        continue;
      }
      const exportStarted = Date.now();
      const n = await exportTable(conn, table, path.join(buildDir, `${table}.json`));
      exported.set(table, n);
      console.log(colors.cyan(`exported ${n} rows of ${table} (${seconds(exportStarted)} s)`));
    }
    const outside = present.filter((table) => !(table in TABLES));
    if (outside.length) {
      console.log(colors.yellow(`not exported, outside the catalogue: ${outside.join(", ")}`));
    }

    // before PostgreSQL is touched: a row the constraints refuse is fixed in
    // RethinkDB, and the whole list is worth more than the first hit
    const preflightStarted = Date.now();
    const exportedRows: RowSource = (table, each) => {
      const file = path.join(buildDir, `${table}.json`);
      return fs.existsSync(file) ? streamFile(file, async (rows) => rows.forEach(each)) : Promise.resolve();
    };
    const { skipped, blocking } = has("skip-duplicates")
      ? await planSkips(exportedRows)
      : { skipped: [], blocking: await checkConstraints(exportedRows) };
    if (blocking.length) {
      for (const v of blocking) {
        console.log(colors.red(`${v.constraint.name}: ${v.constraint.table} ${v.id} ${v.detail}`));
      }
      const redundant = blocking.filter((v) => v.duplicateOf !== undefined && v.constraint.table in KEEP_FIRST).length;
      const byHand = blocking.length - redundant;
      throw new Error(
        `${blocking.length} rows violate the PostgreSQL constraints (${seconds(preflightStarted)} s), nothing was migrated.` +
          (redundant
            ? ` ${redundant} are duplicate relations or acl_permissions rows: the fixDuplicateRowsJob job removes them in RethinkDB, --skip-duplicates leaves them out of the import.`
            : "") +
          (byHand
            ? ` ${byHand} have no automatic fix (a dangling territory, parent or user reference, a duplicate user email): correct them in RethinkDB and rerun.`
            : "")
      );
    }
    const leftOut = skippedIds(skipped);
    for (const table of leftOut.keys()) {
      // the export stays the whole snapshot; the seeder reads <table>.json only
      const rows = skipped.filter((s) => s.table === table).map((s) => s.row);
      await writeJsonArray(rows, path.join(buildDir, `${table}.skipped.json`));
    }
    for (const s of skipped) {
      console.log(colors.yellow(`${s.table} ${s.row.id}: left out of the import, duplicate of ${s.kept}`));
    }
    console.log(
      skipped.length
        ? colors.yellow(`${skipped.length} duplicate rows left out, constraints hold on the rest (${seconds(preflightStarted)} s)`)
        : colors.green(`constraints hold on every exported row (${seconds(preflightStarted)} s)`)
    );

    // a build under this name is what an earlier run left behind
    if (existing.includes(names.build)) {
      await postgres.dbDrop();
    }
    await postgres.dbCreate();
    building = true;
    await postgres.createTables();

    const importStarted = Date.now();
    const dataset = await prepareRawDataset(buildOut);
    let total = noRows();
    for (const table of Object.values(dataset)) {
      const ids = leftOut.get(table.tableName);
      if (ids) {
        // the seeder runs the transform on the loaded table and on every streamed batch
        table.transform = function (this: TableSchema) {
          this.data = this.data.filter((row: { id: unknown }) => !ids.has(String(row.id)));
        };
      }
      const [counts] = await feedTable([postgres], table, dataFilePath(buildOut, table));
      total = addCounts(total, counts);
      // a row PostgreSQL skipped over a repeated id or refused shows up here
      const expected = (exported.get(table.tableName) ?? 0) - (ids?.size ?? 0);
      const stored = await postgres.count(table);
      if (stored !== expected) {
        console.log(colors.red(`${table.tableName}: ${stored} rows in PostgreSQL, ${expected} expected from the export`));
        process.exitCode = 1;
      }
    }
    console.log(colors.cyan(`imported ${total.inserted} rows (${seconds(importStarted)} s)`));
    if (total.failed) {
      console.log(colors.red(`${total.failed} rows dropped on import`));
      process.exitCode = 1;
    }

    if (!has("no-diff")) {
      const diffStarted = Date.now();
      const reports = await diffDatabases(conn, await postgres.client(), { indexes: true, leftOut });
      printReports(reports);
      if (hasDifferences(reports)) {
        console.log(colors.red(`storage diff: differences found (${seconds(diffStarted)} s)`));
        process.exitCode = 1;
      } else {
        const lenient = lenientCount(reports);
        const warnings = lenient ? `${lenient} lenient warning${lenient === 1 ? "" : "s"}, ` : "";
        console.log(colors.green(`storage diff: databases match (${warnings}${seconds(diffStarted)} s)`));
      }
    }

    // last, so a dangling row is reported next to the import counts and the diff that explain it
    try {
      await postgres.addConstraints();
    } catch (e) {
      console.log(colors.red(e instanceof Error ? e.message : String(e)));
      process.exitCode = 1;
    }

    if (process.exitCode) {
      return;
    }
    await postgres.dbPromote(pgName, taken ? names.aside : undefined);
    promoted = true;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.renameSync(buildDir, dir);
    if (taken) {
      console.log(colors.yellow(`the replaced ${pgName} is kept as ${names.aside}, drop it once it is not needed`));
    }
    console.log(colors.green(`migrated ${dbName} -> ${pgName} (postgres) through datasets/${out} in ${seconds(started)} s`));
  } finally {
    if (!promoted && fs.existsSync(buildDir)) {
      const kept = [`datasets/${buildOut}`, ...(building ? [`database ${names.build}`] : [])];
      console.log(
        colors.red(
          `not migrated: database ${pgName} and datasets/${out} are as they were. ` +
            `This run is kept as ${kept.join(" and ")} until the next run replaces it.`
        )
      );
    }
    await rethink.end();
    await postgres.end();
  }
}

main().catch((e) => {
  console.error(colors.red(e instanceof Error ? e.stack ?? e.message : String(e)));
  process.exit(1);
});
