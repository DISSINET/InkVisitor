import { spawnSync } from "child_process";
import colors from "colors/safe";
import * as fs from "fs";
import * as path from "path";
import { flag, has, positionals } from "./import/common";
import { DATASETS_DIR, datasets, findRawDatasets, MAX_LOAD_JSON_BYTES } from "./import/datasets";

/**
 * Phase gate for #3259: every dataset seeded into both databases has to diff
 * clean. Each dataset runs in its own seed process because the registry
 * shares required JSON objects between datasets and a transform mutates them.
 *   pnpm seed:check [--datasets=a,b] [--all] [--no-indexes] [env]
 * Only ever touches the database named inkvisitor_seedcheck, on both backends.
 */
const DB = "inkvisitor_seedcheck";

/** a dataset with a file above the load limit takes long enough to need --all */
const heavy = (name: string): boolean =>
  fs
    .readdirSync(path.join(DATASETS_DIR, name))
    .some(
      (file) =>
        file.endsWith(".json") &&
        fs.statSync(path.join(DATASETS_DIR, name, file)).size > MAX_LOAD_JSON_BYTES
    );

/** `capture` hands back the child's stdout as well as writing it through unchanged */
function run(
  script: string,
  args: string[],
  capture = false
): { ok: boolean; out: string } {
  const result = spawnSync(
    "npx",
    ["ts-node", "-r", "./scripts/register-paths.ts", script, ...args],
    { stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit", encoding: "utf8" }
  );
  const out = result.stdout ?? "";
  if (capture) {
    process.stdout.write(out);
  }
  return { ok: result.status === 0, out };
}

/** the count from the storage diff's closing line, 0 when it reports none */
const lenientWarnings = (out: string): number =>
  parseInt(out.match(/databases match \((\d+) lenient/)?.[1] ?? "0");

const [env] = positionals();
const envArgs = env ? [env] : [];
const indexArgs = has("no-indexes") ? ["--no-indexes"] : [];
const wanted =
  flag("datasets")?.split(",") ??
  [...Object.keys(datasets), ...findRawDatasets()].filter((d) => has("all") || !heavy(d));

const results: { dataset: string; ok: boolean; seconds: number; lenient: number }[] = [];
for (const dataset of wanted) {
  console.log(colors.cyan(`\n=== ${dataset} ===`));
  const started = Date.now();
  const seeded = run("scripts/seed.ts", [
    `--db=${DB}`,
    `--dataset=${dataset}`,
    "--target=both",
    ...envArgs,
  ]);
  const diffed = seeded.ok
    ? run("scripts/storage-diff/run.ts", [`--db=${DB}`, ...indexArgs, ...envArgs], true)
    : { ok: false, out: "" };
  results.push({
    dataset,
    ok: seeded.ok && diffed.ok,
    seconds: (Date.now() - started) / 1000,
    lenient: lenientWarnings(diffed.out),
  });
}

console.log("\nseed:check summary");
for (const result of results) {
  const warnings = result.lenient
    ? `, ${result.lenient} lenient warning${result.lenient === 1 ? "" : "s"}`
    : "";
  console.log(
    `  ${result.ok ? colors.green("ok  ") : colors.red("FAIL")} ${result.dataset} (${result.seconds.toFixed(0)} s${warnings})`
  );
}
process.exit(results.every((result) => result.ok) ? 0 : 1);
