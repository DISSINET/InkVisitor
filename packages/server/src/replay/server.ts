import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";

/**
 * Boots the API as a child process the way the replay and the frontend smoke
 * suite need it: a fixed environment, no env file, logs in one file.
 */
const SERVER_ROOT = path.resolve(__dirname, "../..");

export interface ServerOptions {
  /** storage backend, rethinkdb or postgres */
  adapter: string;
  /** ENV of the process, the session cookie name derives from it */
  instance: string;
  /** stdout and stderr of the server */
  logFile: string;
  /** CORS_ORIGINS: browser origins allowed besides DOMAIN, comma separated */
  corsOrigins?: string;
}

export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

export function startServer(port: number, opts: ServerOptions): ChildProcess {
  const log = fs.openSync(opts.logFile, "w");
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: "development",
    ENV: opts.instance,
    DOMAIN: `localhost:${port}`,
    CORS_ORIGINS: opts.corsOrigins,
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
    DB_ADAPTER: opts.adapter,
    PG_HOST: process.env.PG_HOST,
    PG_PORT: process.env.PG_PORT,
    PG_USER: process.env.PG_USER,
    PG_PASS: process.env.PG_PASS,
  };
  return spawn(
    process.execPath,
    [require.resolve("ts-node/dist/bin"), "-r", "./src/register-paths.ts", "./src"],
    { cwd: SERVER_ROOT, env, stdio: ["ignore", log, log] }
  );
}

export async function waitForHealth(port: number, server: ChildProcess, logFile: string): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited with ${server.exitCode}, see ${logFile}`);
    }
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.status === 200) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`server did not become healthy, see ${logFile}`);
}
