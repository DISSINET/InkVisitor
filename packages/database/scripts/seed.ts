import colors from "colors/safe";
import { flag, getEnvOptional } from "./import/common";
import {
  dataFilePath,
  datasets,
  findRawDatasets,
  prepareRawDataset,
} from "./import/datasets";
import { addCounts, feedTable, noRows } from "./import/feed";
import { createTargets } from "./import/targets";

/**
 * Non-interactive drop + create + import of one dataset, the same import code
 * as the interactive `pnpm start`:
 *   pnpm seed --db=<name> --dataset=<name> [--target=rethinkdb] [env]
 */
async function main(): Promise<void> {
  const dbName = flag("db");
  const datasetName = flag("dataset");
  if (!dbName || !datasetName) {
    throw new Error(
      "usage: seed --db=<name> --dataset=<name> [--target=rethinkdb] [env]"
    );
  }
  const dataset = datasets[datasetName]
    ? datasets[datasetName]
    : findRawDatasets().includes(datasetName)
    ? await prepareRawDataset(datasetName)
    : undefined;
  if (!dataset) {
    throw new Error(`Unknown dataset '${datasetName}'`);
  }

  const targets = createTargets(flag("target") ?? getEnvOptional("DB_TARGET") ?? "rethinkdb");
  const started = Date.now();
  for (const target of targets) {
    await target.connect();
    target.useDb(dbName);
    await target.dbDrop();
    await target.dbCreate();
    await target.createTables();
  }
  let totals = targets.map(noRows);
  for (const table of Object.values(dataset)) {
    const counts = await feedTable(targets, table, dataFilePath(datasetName, table));
    totals = totals.map((total, i) => addCounts(total, counts[i]));
  }
  for (const target of targets) {
    await target.end();
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const line = `seeded ${datasetName} into ${dbName} on ${targets
    .map((t) => t.kind)
    .join(" + ")} in ${seconds} s`;
  // every target sees the same rows, so the counts are reported per target
  for (const [i, target] of targets.entries()) {
    if (totals[i].duplicates) {
      console.log(colors.yellow(`${target.kind}: ${totals[i].duplicates} duplicate ids skipped`));
    }
  }
  const failures = targets
    .map((target, i) => (totals[i].failed ? `${target.kind}: ${totals[i].failed}` : ""))
    .filter(Boolean);
  if (failures.length) {
    console.log(colors.red(`${line}, rows dropped (${failures.join(", ")})`));
    process.exitCode = 1;
  } else {
    console.log(colors.green(line));
  }
}

main().catch((e) => {
  console.error(colors.red(e instanceof Error ? e.stack ?? e.message : String(e)));
  process.exit(1);
});
