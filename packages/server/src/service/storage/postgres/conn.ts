import { Client, QueryResult, QueryResultRow } from "pg";
import { PgConfig, pgConfigFromEnv } from "../config";
import { REQUIRED } from "../requiredIndexes";
import { Conn } from "../types";
import { MERGE_FUNCTION_DDL, SESSIONS_DDL, pgIndexName, provision } from "./provision";
import { ident } from "./sql";

export const pgConfig: PgConfig = pgConfigFromEnv();

/**
 * one Client per Conn; `open` tracks the socket since the driver has no public
 * flag; `queue` is the tail of the queries issued on the Conn (see query())
 */
interface PgConn {
  client: Client;
  open: boolean;
  queue: Promise<unknown>;
}

const unwrap = (conn: Conn): PgConn => conn as unknown as PgConn;
const wrap = (conn: PgConn): Conn => conn as unknown as Conn;
const client = (conn: Conn): Client => unwrap(conn).client;

/**
 * Runs `sql` on the Conn's Client after every query issued on it before. The
 * driver accepts one query at a time per client, while the application issues
 * queries concurrently on one connection (Promise.all over a request's
 * lookups), so each query waits for the previous one to settle, in issue
 * order; a rejected query does not hold up the next one.
 */
export function query<R extends QueryResultRow = any>(
  conn: Conn,
  sql: string,
  params: unknown[] = []
): Promise<QueryResult<R>> {
  const c = unwrap(conn);
  const run = () => c.client.query<R>(sql, params);
  const next = c.queue.then(run, run);
  c.queue = next.catch(() => undefined);
  return next;
}

export function assertConfigured(): void {
  if (!pgConfig.host || !pgConfig.port || !pgConfig.user || !pgConfig.database) {
    throw new Error("Missing PostgreSQL params (PG_HOST, PG_PORT, PG_USER, DB_NAME), check env vars");
  }
}

/** `db: null` opens the maintenance database, for create/drop of another one */
export async function openConnection(
  opts: { db?: string | null; timeoutSeconds?: number } = {}
): Promise<Conn> {
  const c = new Client({
    host: pgConfig.host,
    port: pgConfig.port,
    user: pgConfig.user,
    password: pgConfig.password,
    database: opts.db === null ? "postgres" : opts.db ?? pgConfig.database,
    connectionTimeoutMillis: (opts.timeoutSeconds ?? 30) * 1000,
  });
  const conn: PgConn = { client: c, open: false, queue: Promise.resolve() };
  // an unhandled 'error' event would crash the process; the pool's ping
  // evicts the connection on its next borrow
  c.on("error", () => {
    conn.open = false;
  });
  c.on("end", () => {
    conn.open = false;
  });
  await c.connect();
  conn.open = true;
  return wrap(conn);
}

export async function closeConnection(conn: Conn, _opts: { noreplyWait?: boolean } = {}): Promise<void> {
  const c = unwrap(conn);
  c.open = false;
  await c.client.end();
}

export function isOpen(conn: Conn): boolean {
  return unwrap(conn).open;
}

export async function ping(conn: Conn): Promise<void> {
  await query(conn, "SELECT 1");
}

export async function tableList(conn: Conn): Promise<string[]> {
  const { rows } = await query(
    conn,
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  return rows.map((row: { tablename: string }) => row.tablename);
}

async function withMaintenance<T>(fn: (admin: Client) => Promise<T>): Promise<T> {
  const conn = await openConnection({ db: null, timeoutSeconds: 5 });
  try {
    return await fn(client(conn));
  } finally {
    await closeConnection(conn);
  }
}

/** Drops `name` if it exists and recreates it with every table, index and function. */
export async function createDatabase(name: string): Promise<void> {
  await withMaintenance(async (admin) => {
    await admin.query(`DROP DATABASE IF EXISTS ${ident(name)} WITH (FORCE)`);
    // code-point ordering like RethinkDB, Unicode-aware lower/upper
    await admin.query(
      `CREATE DATABASE ${ident(name)} TEMPLATE template0 ENCODING 'UTF8' LOCALE_PROVIDER builtin BUILTIN_LOCALE 'C.UTF-8'`
    );
  });
  const conn = await openConnection({ db: name, timeoutSeconds: 5 });
  try {
    await provision(client(conn));
    for (const statement of SESSIONS_DDL) {
      await query(conn, statement);
    }
  } finally {
    await closeConnection(conn);
  }
}

export async function dropDatabase(name: string): Promise<void> {
  await withMaintenance((admin) => admin.query(`DROP DATABASE IF EXISTS ${ident(name)} WITH (FORCE)`));
}

/**
 * Verifies every entry in REQUIRED exists in pg_indexes, then (re)creates the
 * merge function the generic store's updates call: a database seeded before
 * the function existed becomes usable without a reseed, and no index depends
 * on the function so replacing it is safe.
 */
export async function assertRequiredIndexes(conn: Conn): Promise<void> {
  const { rows } = await query(conn, "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public'");
  const present = new Set(
    rows.map((row: { tablename: string; indexname: string }) => `${row.tablename}.${row.indexname}`)
  );
  const missing = REQUIRED.filter((req) => !present.has(`${req.table}.${pgIndexName(req.table, req.index)}`));
  if (missing.length) {
    const lines = missing.map((m) => `  - ${m.table}.${m.index}  (${m.usedBy})`).join("\n");
    throw new Error(
      `[startup] required PostgreSQL indexes are missing:\n${lines}\n\n` +
        `Provision the database with the seeder in packages/database ` +
        `(pnpm seed --target=postgres) and restart the server.`
    );
  }
  await query(conn, MERGE_FUNCTION_DDL);
  console.log(`[startup] verified ${REQUIRED.length} required PostgreSQL indexes`);
}
