import colors from "colors/safe";
import * as fs from "fs";
import * as path from "path";
import { r } from "rethinkdb-ts";
import { TABLES } from "@service/storage/postgres/provision";
import { flag, has } from "../import/common";
import { DATASETS_DIR, dataFilePath, prepareRawDataset } from "../import/datasets";
import { addCounts, feedTable, noRows, streamFile } from "../import/feed";
import { PostgresTarget } from "../import/targets/postgres";
import { RethinkTarget } from "../import/targets/rethinkdb";
import { diffDatabases, hasDifferences, lenientCount, printReports } from "../storage-diff/diff";
import { exportTable } from "./export";
import { checkConstraints } from "./preflight";

/**
 * Moves one RethinkDB database into PostgreSQL: every catalogue table is
 * exported into datasets/<out>/<table>.json, the export is checked against
 * the PostgreSQL constraints, the PostgreSQL database is created with the
 * schema, the export is imported through the seeder and the two databases are
 * diffed. RethinkDB is only read.
 *   pnpm migrate --db=<name> [--pg=<name>] [--out=<dir>] [--drop] [--no-diff] [env]
 */
const USAGE = "usage: migrate --db=<name> [--pg=<name>] [--out=<dir>] [--drop] [--no-diff] [env]";

const FLAGS = ["db", "pg", "out", "drop", "no-diff"];

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
  const started = Date.now();

  const rethink = new RethinkTarget();
  const postgres = new PostgresTarget();
  await rethink.connect();
  await postgres.connect();
  try {
    if (!(await rethink.dbList()).includes(dbName)) {
      throw new Error(`RethinkDB database ${dbName} does not exist`);
    }
    rethink.useDb(dbName);
    postgres.useDb(pgName);
    const replace = (await postgres.dbList()).includes(pgName);
    if (replace && !has("drop")) {
      throw new Error(`PostgreSQL database ${pgName} exists, pass --drop to replace it`);
    }

    const conn = rethink.getConnection();
    const present = (await r.tableList().run(conn)) as string[];
    // the directory belongs to this run; a file left by an earlier run would be imported too
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    for (const table of Object.keys(TABLES)) {
      if (!present.includes(table)) {
        console.log(colors.gray(`${table}: not in RethinkDB, skipped`));
        continue;
      }
      const exportStarted = Date.now();
      const n = await exportTable(conn, table, path.join(dir, `${table}.json`));
      console.log(colors.cyan(`exported ${n} rows of ${table} (${seconds(exportStarted)} s)`));
    }
    const outside = present.filter((table) => !(table in TABLES));
    if (outside.length) {
      console.log(colors.yellow(`not exported, outside the catalogue: ${outside.join(", ")}`));
    }

    // before PostgreSQL is touched: a row the constraints refuse is fixed in
    // RethinkDB, and the whole list is worth more than the first hit
    const preflightStarted = Date.now();
    const violations = await checkConstraints((table, each) => {
      const file = path.join(dir, `${table}.json`);
      return fs.existsSync(file) ? streamFile(file, async (rows) => rows.forEach(each)) : Promise.resolve();
    });
    if (violations.length) {
      for (const v of violations) {
        console.log(colors.red(`${v.constraint.name}: ${v.constraint.table} ${v.id} ${v.detail}`));
      }
      throw new Error(
        `${violations.length} rows violate the PostgreSQL constraints (${seconds(preflightStarted)} s), nothing was migrated. ` +
          `Fix them in RethinkDB (the fixDuplicateRowsJob job covers duplicates and dangling document and template references) and rerun.`
      );
    }
    console.log(colors.green(`constraints hold on every exported row (${seconds(preflightStarted)} s)`));

    if (replace) {
      await postgres.dbDrop();
    }
    await postgres.dbCreate();
    await postgres.createTables();

    const importStarted = Date.now();
    const dataset = await prepareRawDataset(out);
    let total = noRows();
    for (const table of Object.values(dataset)) {
      const [counts] = await feedTable([postgres], table, dataFilePath(out, table));
      total = addCounts(total, counts);
    }
    console.log(colors.cyan(`imported ${total.inserted} rows (${seconds(importStarted)} s)`));
    if (total.failed) {
      console.log(colors.red(`${total.failed} rows dropped on import`));
      process.exitCode = 1;
    }

    if (!has("no-diff")) {
      const diffStarted = Date.now();
      const reports = await diffDatabases(conn, await postgres.client(), { indexes: true });
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

    const line = `migrated ${dbName} -> ${pgName} (postgres) through datasets/${out} in ${seconds(started)} s`;
    console.log(process.exitCode ? colors.red(line) : colors.green(line));
  } finally {
    await rethink.end();
    await postgres.end();
  }
}

main().catch((e) => {
  console.error(colors.red(e instanceof Error ? e.stack ?? e.message : String(e)));
  process.exit(1);
});
