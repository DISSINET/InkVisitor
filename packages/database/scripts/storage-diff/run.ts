import colors from "colors/safe";
import { flag, has } from "../import/common";
import { PostgresTarget } from "../import/targets/postgres";
import { RethinkTarget } from "../import/targets/rethinkdb";
import { diffDatabases, hasDifferences, lenientCount, printReports } from "./diff";

/**
 * Compares a RethinkDB database with a PostgreSQL database document by
 * document and, unless --no-indexes, index key by index key:
 *   pnpm storage:diff --db=<name> [--pg=<name>] [--no-indexes] [env]
 * Exits 1 on any difference.
 */
async function main(): Promise<void> {
  const dbName = flag("db");
  if (!dbName) {
    throw new Error("usage: storage:diff --db=<name> [--pg=<name>] [--no-indexes] [env]");
  }
  const rethink = new RethinkTarget();
  const postgres = new PostgresTarget();
  await rethink.connect();
  await postgres.connect();
  rethink.useDb(dbName);
  postgres.useDb(flag("pg") ?? dbName);
  try {
    const started = Date.now();
    const reports = await diffDatabases(rethink.getConnection(), await postgres.client(), {
      indexes: !has("no-indexes"),
    });
    printReports(reports);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    if (hasDifferences(reports)) {
      console.log(colors.red(`storage diff: differences found (${seconds} s)`));
      process.exitCode = 1;
    } else {
      const lenient = lenientCount(reports);
      const warnings = lenient
        ? `${lenient} lenient warning${lenient === 1 ? "" : "s"}, `
        : "";
      console.log(colors.green(`storage diff: databases match (${warnings}${seconds} s)`));
    }
  } finally {
    await rethink.end();
    await postgres.end();
  }
}

main().catch((e) => {
  console.error(colors.red(e instanceof Error ? e.stack ?? e.message : String(e)));
  process.exit(1);
});
