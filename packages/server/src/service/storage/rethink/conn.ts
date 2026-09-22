import { Connection, r } from "rethinkdb-ts";
import { Conn } from "../types";

export const rethinkConfig = {
  db: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process?.env?.DB_PORT || "28015"),
  password: process.env.DB_AUTH,
};

export const unwrap = (conn: Conn): Connection => conn as unknown as Connection;
export const wrap = (conn: Connection): Conn => conn as unknown as Conn;

export function assertConfigured(): void {
  if (!rethinkConfig.db || !rethinkConfig.host || !rethinkConfig.port) {
    throw new Error("Missing db params, check env vars");
  }
}

export async function openConnection(opts: {
  db?: string | null;
  timeoutSeconds?: number;
} = {}): Promise<Conn> {
  const conn = await r.connect({
    host: rethinkConfig.host,
    port: rethinkConfig.port,
    password: rethinkConfig.password || undefined,
    db: opts.db === null ? undefined : opts.db ?? rethinkConfig.db,
    timeout: opts.timeoutSeconds ?? 30,
  });
  return wrap(conn);
}

export async function closeConnection(
  conn: Conn,
  opts: { noreplyWait?: boolean } = {}
): Promise<void> {
  await unwrap(conn).close({ noreplyWait: opts.noreplyWait ?? true });
}

export function isOpen(conn: Conn): boolean {
  // `open` is a driver-side flag that can lag behind reality when the server
  // has closed the socket; ping() is the only way to be sure.
  return unwrap(conn).open;
}

export async function ping(conn: Conn): Promise<void> {
  await r.expr(1).run(unwrap(conn));
}

export async function tableList(conn: Conn): Promise<string[]> {
  return (await r.tableList().run(unwrap(conn))) as string[];
}
