import { adapter } from "./adapterFromArgv";
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { dropReplayDb, seedReplayDb } from "./seed";
import { freePort, startServer, waitForHealth } from "./server";
import { Actor, Step, steps } from "./requests";
import { Normalizer, getPath, sortAt, stripPaths } from "./normalize";

/**
 * API replay check (#3258). Seeds a throwaway database, boots the real server
 * against it, fires the fixed request list from ./requests.ts and records the
 * normalized responses, one file per step.
 *
 *   pnpm replay            compare against replay-baseline/, exit 1 on any diff
 *   pnpm replay --record   rewrite replay-baseline/
 *   --keep-db              leave the replay database in place for inspection
 *   pnpm replay --adapter=postgres
 *                          seed and boot on the PostgreSQL adapter (#3260)
 *                          and compare every step against the same baseline,
 *                          the steps in PORTED_STEPS_NOT_COMPARED by status only.
 *                          PG_HOST / PG_PORT / PG_USER / PG_PASS are taken
 *                          from the environment (localhost:5432, inkvisitor).
 *
 * The baseline is recorded on the merged tree with the RethinkDB adapter
 * (`pnpm replay --record` is refused on PostgreSQL), so a difference on
 * PostgreSQL is an adapter difference; an error both adapters share is
 * invisible to the replay and is caught by the storage suites instead.
 * DB_HOST / DB_PORT / DB_AUTH are taken from the environment (localhost:28015
 * by default); the database name must match the test pattern in src/test/db.ts.
 */
const SERVER_ROOT = path.resolve(__dirname, "../..");
const BASELINE_DIR = path.join(SERVER_ROOT, "replay-baseline");
const SERVER_LOG = path.join(os.tmpdir(), "inkvisitor-replay-server.log");

interface Recording {
  request: { as: Actor; method: string; path: string; body?: unknown };
  response: { status: number; contentType: string; body?: unknown };
}

/**
 * run with only the status compared: their bodies carry an ordering the
 * normalizer cannot pin
 * - entities-delete-used-denied: the 400 message names the first relation
 *   relations.forEntities returns, which is RethinkDB distinct() order against
 *   id order on PostgreSQL, and data.ids carries the same ordering; the rows
 *   are identical
 */
export const PORTED_STEPS_NOT_COMPARED: string[] = ["entities-delete-used-denied"];

/**
 * Aliases are numbered by first appearance across the whole run, so one step
 * that lists new ids in a different order shifts the numbers in every later
 * file. Renumbering per file keeps every within-file identity and drops the
 * cross-file dependence.
 */
export function renumberAliases(text: string): string {
  const seen = new Map<string, string>();
  return text.replace(/<uuid-\d+>/g, (alias) => {
    let local = seen.get(alias);
    if (!local) {
      local = `<uuid-${seen.size + 1}>`;
      seen.set(alias, local);
    }
    return local;
  });
}

function fileName(index: number, step: Step): string {
  return `${String(index + 1).padStart(3, "0")}-${step.name}.json`;
}

async function replay(port: number): Promise<Map<string, Recording>> {
  const norm = new Normalizer();
  const sessions: Partial<Record<Actor, string>> = {};
  const vars: Record<string, string> = {};
  const fill = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  const out = new Map<string, Recording>();

  for (const [index, step] of steps.entries()) {
    const reqPath = fill(step.path);
    const reqBody =
      step.body === undefined ? undefined : JSON.parse(fill(JSON.stringify(step.body)));
    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
      "x-inkvisitor-client": "1",
      origin: `http://localhost:${port}`,
    };
    const cookie = step.as === "anon" ? undefined : sessions[step.as];
    if (cookie) headers.cookie = cookie;

    const res = await fetch(`http://127.0.0.1:${port}${reqPath}`, {
      method: step.method,
      headers,
      body: reqBody === undefined ? undefined : JSON.stringify(reqBody),
      redirect: "manual",
    });

    const setCookie = res.headers.getSetCookie();
    const sessionActor = step.saveSessionAs ?? (step.as === "anon" ? undefined : step.as);
    if (setCookie.length && sessionActor) {
      sessions[sessionActor] = setCookie.map((c) => c.split(";")[0]).join("; ");
    }

    const contentType = (res.headers.get("content-type") || "").split(";")[0];
    let body: unknown;
    if (step.binary) {
      await res.arrayBuffer();
    } else {
      const text = await res.text();
      body = contentType === "application/json" && text ? JSON.parse(text) : text;
    }
    for (const [name, dotPath] of Object.entries(step.capture ?? {})) {
      vars[name] = String(getPath(body, dotPath));
    }
    if (step.strip) stripPaths(body, step.strip);
    // sorted twice: before normalization so ids that first appear in this list
    // are aliased in a deterministic order, after it so lists keyed by those
    // aliases end up in alias order
    for (const spec of step.sort ?? []) sortAt(body, spec);
    const recorded = norm.value(body);
    for (const spec of step.sort ?? []) sortAt(recorded, spec);

    console.log(`${String(res.status).padEnd(4)} ${step.method.padEnd(6)} ${reqPath}`);
    out.set(fileName(index, step), {
      request: {
        as: step.as,
        method: step.method,
        path: norm.text(reqPath),
        body: norm.value(reqBody),
      },
      response: { status: res.status, contentType, body: recorded },
    });
  }
  return out;
}

function writeRecordings(dir: string, recordings: Map<string, Recording>): void {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, rec] of recordings) {
    fs.writeFileSync(path.join(dir, name), JSON.stringify(rec, null, 2) + "\n");
  }
}

async function main(): Promise<number> {
  const record = process.argv.includes("--record");
  const keepDb = process.argv.includes("--keep-db");
  if (record && adapter !== "rethinkdb") {
    throw new Error("the baseline is recorded on RethinkDB only");
  }
  process.env.DB_NAME = process.env.REPLAY_DB_NAME || "inkvisitor_replay_test";

  console.log(`seeding ${process.env.DB_NAME}`);
  await seedReplayDb();
  const port = await freePort();
  const server = startServer(port, { adapter, instance: "inkvisitor-replay", logFile: SERVER_LOG });
  try {
    await waitForHealth(port, server, SERVER_LOG);
    const recordings = await replay(port);
    if (record) {
      writeRecordings(BASELINE_DIR, recordings);
      console.log(`recorded ${recordings.size} steps to ${BASELINE_DIR}`);
      return 0;
    }
    const candidate = fs.mkdtempSync(path.join(os.tmpdir(), "inkvisitor-replay-"));
    writeRecordings(candidate, recordings);
    let diff: ReturnType<typeof spawnSync>;
    if (adapter === "postgres") {
      // alias numbers renumbered per file on both sides
      const expected = fs.mkdtempSync(path.join(os.tmpdir(), "inkvisitor-replay-expected-"));
      const stepByFile = new Map(steps.map((step, index) => [fileName(index, step), step]));
      const comparable = (file: string, step: Step): string => {
        const rec: Recording = JSON.parse(fs.readFileSync(file, "utf8"));
        for (const spec of step.pgSort ?? []) sortAt(rec.response.body, spec);
        return renumberAliases(JSON.stringify(rec, null, 2) + "\n");
      };
      // a not-compared step keeps its status in the diff, so a route that
      // fails or answers 501 cannot hide behind its skipped body
      const statusOnly = (file: string): string => {
        const rec: Recording = JSON.parse(fs.readFileSync(file, "utf8"));
        return JSON.stringify({ status: rec.response.status }) + "\n";
      };
      for (const [name] of recordings) {
        const step = stepByFile.get(name) as Step;
        const project = PORTED_STEPS_NOT_COMPARED.includes(step.name)
          ? statusOnly
          : (file: string) => comparable(file, step);
        fs.writeFileSync(path.join(expected, name), project(path.join(BASELINE_DIR, name)));
        fs.writeFileSync(path.join(candidate, name), project(path.join(candidate, name)));
      }
      diff = spawnSync("diff", ["-ru", expected, candidate], { encoding: "utf8" });
      fs.rmSync(expected, { recursive: true, force: true });
    } else {
      diff = spawnSync("diff", ["-ru", BASELINE_DIR, candidate], { encoding: "utf8" });
    }
    if (diff.status === 0) {
      console.log(`replay matches baseline (${recordings.size} steps${adapter === "postgres" ? " on postgres" : ""})`);
      fs.rmSync(candidate, { recursive: true, force: true });
      return 0;
    }
    process.stdout.write(diff.stdout);
    console.log(`replay differs from baseline, candidate kept at ${candidate}`);
    return 1;
  } finally {
    server.kill();
    if (!keepDb) await dropReplayDb();
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(2);
  }
);
