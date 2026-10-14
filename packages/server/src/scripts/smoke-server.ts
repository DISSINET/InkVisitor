import os from "os";
import path from "path";

/**
 * API for the frontend smoke suite (packages/client/e2e): drops and seeds the
 * smoke database with the replay seed, boots the server on the fixed smoke
 * port and keeps running until this process is killed. DB_HOST/DB_PORT point
 * at the database, with the same defaults as the replay.
 */
const SMOKE_PORT = 3301;
// the vite server of packages/client/playwright.config.ts, which calls the
// API cross-origin
const CLIENT_ORIGIN = "http://127.0.0.1:8301";
const SMOKE_LOG = path.join(os.tmpdir(), "inkvisitor-smoke-server.log");

process.env.DB_NAME = "inkvisitor_smoke_test";

// the storage module reads its connection settings when it loads, after the
// environment above is in place
const { seedReplayDb } = require("../replay/seed") as typeof import("../replay/seed");
const { startServer, waitForHealth } = require("../replay/server") as typeof import("../replay/server");

async function main(): Promise<void> {
  console.log(`[smoke-server] seeding ${process.env.DB_NAME}`);
  await seedReplayDb();
  const server = startServer(SMOKE_PORT, {
    instance: "inkvisitor-smoke",
    logFile: SMOKE_LOG,
    corsOrigins: CLIENT_ORIGIN,
  });
  const stop = () => {
    server.kill();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  // the API stopping means the stack is down, whatever its exit code
  server.on("exit", (code, signal) => {
    console.error(`[smoke-server] API exited with ${code ?? signal}, see ${SMOKE_LOG}`);
    process.exit(1);
  });
  try {
    await waitForHealth(SMOKE_PORT, server, SMOKE_LOG);
  } catch (e) {
    // Playwright kills the process group only while this script is alive
    server.kill();
    throw e;
  }
  console.log(`[smoke-server] ready on http://127.0.0.1:${SMOKE_PORT}, log ${SMOKE_LOG}`);
}

main().catch((e) => {
  // a refused connection is an AggregateError with an empty message
  console.error(`[smoke-server] FAILED: ${e.message || e.code || e}`);
  process.exit(1);
});
