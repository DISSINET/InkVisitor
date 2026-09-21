import { ChildProcess, spawn, spawnSync } from "child_process";
import fs from "fs";
import net from "net";
import os from "os";
import path from "path";
import { dropReplayDb, seedReplayDb } from "./seed";
import { Actor, Step, steps } from "./requests";
import { Normalizer, getPath, sortAt, stripPaths } from "./normalize";

/**
 * API replay check (#3258). Seeds a throwaway RethinkDB, boots the real server
 * against it, fires the fixed request list from ./requests.ts and records the
 * normalized responses, one file per step.
 *
 *   pnpm replay            compare against replay-baseline/, exit 1 on any diff
 *   pnpm replay --record   rewrite replay-baseline/
 *   --keep-db              leave the replay database in place for inspection
 *
 * The baseline was recorded before the storage adapter refactor; every later
 * phase of the PostgreSQL migration (#3256) must show zero diff against it.
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

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

function startServer(port: number): ChildProcess {
  const log = fs.openSync(SERVER_LOG, "w");
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: "development",
    ENV: "inkvisitor-replay",
    DOMAIN: `localhost:${port}`,
    STATIC_PATH: "",
    SWAGGER_FILE: "",
    BACKUP_DIR: "",
    LOG_SLOW_QUERIES: "0",
    PORT: String(port),
    HTTPS: "0",
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_PORT: process.env.DB_PORT || "28015",
    DB_NAME: process.env.DB_NAME,
    DB_AUTH: process.env.DB_AUTH || "",
    DB_POOL_CONNECTIONS: "10",
    SECRET: "replay-secret",
  };
  return spawn(
    process.execPath,
    [require.resolve("ts-node/dist/bin"), "-r", "./src/register-paths.ts", "./src"],
    { cwd: SERVER_ROOT, env, stdio: ["ignore", log, log] }
  );
}

async function waitForHealth(port: number, server: ChildProcess): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited with ${server.exitCode}, see ${SERVER_LOG}`);
    }
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.status === 200) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`server did not become healthy, see ${SERVER_LOG}`);
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
  process.env.DB_NAME = process.env.REPLAY_DB_NAME || "inkvisitor_replay_test";

  console.log(`seeding ${process.env.DB_NAME}`);
  await seedReplayDb();
  const port = await freePort();
  const server = startServer(port);
  try {
    await waitForHealth(port, server);
    const recordings = await replay(port);
    if (record) {
      writeRecordings(BASELINE_DIR, recordings);
      console.log(`recorded ${recordings.size} steps to ${BASELINE_DIR}`);
      return 0;
    }
    const candidate = fs.mkdtempSync(path.join(os.tmpdir(), "inkvisitor-replay-"));
    writeRecordings(candidate, recordings);
    const diff = spawnSync("diff", ["-ru", BASELINE_DIR, candidate], { encoding: "utf8" });
    if (diff.status === 0) {
      console.log(`replay matches baseline (${recordings.size} steps)`);
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
