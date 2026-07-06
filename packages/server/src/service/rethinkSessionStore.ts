import { Connection, r } from "rethinkdb-ts";
import session from "express-session";
import DbPool from "./rethink-pool";

export const SESSIONS_TABLE = "sessions";

interface SessionRow {
  id: string;
  userId?: string;
  data: string;
  expiresAt: number;
}

export async function ensureSessionsTable(conn: Connection): Promise<void> {
  const tables = (await r.tableList().run(conn)) as string[];
  if (tables.includes(SESSIONS_TABLE)) {
    return;
  }

  await r.tableCreate(SESSIONS_TABLE).run(conn);
  await r.table(SESSIONS_TABLE).indexCreate("userId").run(conn);
  await r.table(SESSIONS_TABLE).indexCreate("expiresAt").run(conn);
  console.log(`[startup] created RethinkDB table ${SESSIONS_TABLE}`);
}

export async function invalidateUserSessions(
  conn: Connection,
  userId: string
): Promise<void> {
  await r
    .table(SESSIONS_TABLE)
    .getAll(userId, { index: "userId" })
    .delete()
    .run(conn);
}

/**
 * Deletes every session whose expiry has already passed. The store also removes
 * expired rows lazily on get(), but a session that is never accessed again would
 * otherwise linger forever - this sweep reclaims those. Uses the expiresAt index
 * so it is a bounded range delete rather than a full table scan (expiresAt is an
 * epoch-ms timestamp, so 0 is a safe lower bound).
 * @returns number of rows removed
 */
export async function reapExpiredSessions(conn: Connection): Promise<number> {
  const result = await r
    .table(SESSIONS_TABLE)
    .between(0, Date.now(), { index: "expiresAt", rightBound: "closed" })
    .delete()
    .run(conn);
  return result.deleted ?? 0;
}

export class RethinkSessionStore extends session.Store {
  private pool: DbPool;
  private ready: Promise<void> | null = null;

  constructor(pool: DbPool) {
    super();
    this.pool = pool;
  }

  private ensureReady(): Promise<void> {
    if (!this.ready) {
      // Don't cache a rejected promise: if this first check fails (e.g. a
      // transient pool/DB hiccup) we must be able to retry on the next call
      // rather than poisoning every future session op until restart.
      this.ready = this.withConn((conn) => ensureSessionsTable(conn)).catch(
        (err) => {
          this.ready = null;
          throw err;
        }
      );
    }
    return this.ready;
  }

  private async withConn<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    const db = await this.pool.acquire();
    try {
      return await fn(db.connection);
    } finally {
      await this.pool.release(db);
    }
  }

  get(
    sid: string,
    callback: (err: unknown, session?: session.SessionData | null) => void
  ): void {
    this.ensureReady()
      .then(() =>
        this.withConn(async (conn) => {
          const row = (await r
            .table(SESSIONS_TABLE)
            .get(sid)
            .run(conn)) as SessionRow | null;

          if (!row || row.expiresAt <= Date.now()) {
            if (row) {
              await r.table(SESSIONS_TABLE).get(sid).delete().run(conn);
            }
            return null;
          }

          return JSON.parse(row.data) as session.SessionData;
        })
      )
      .then((data) => callback(null, data))
      .catch((err) => callback(err));
  }

  set(
    sid: string,
    sess: session.SessionData,
    callback?: (err?: unknown) => void
  ): void {
    const maxAgeMs =
      typeof sess.cookie?.maxAge === "number" ? sess.cookie.maxAge : 86400000;
    const row: SessionRow = {
      id: sid,
      userId: sess.userId,
      data: JSON.stringify(sess),
      expiresAt: Date.now() + maxAgeMs,
    };

    this.ensureReady()
      .then(() =>
        this.withConn((conn) =>
          r.table(SESSIONS_TABLE).insert(row, { conflict: "replace" }).run(conn)
        )
      )
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  destroy(sid: string, callback?: (err?: unknown) => void): void {
    this.ensureReady()
      .then(() =>
        this.withConn((conn) => r.table(SESSIONS_TABLE).get(sid).delete().run(conn))
      )
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  touch(
    sid: string,
    sess: session.SessionData,
    callback?: (err?: unknown) => void
  ): void {
    this.set(sid, sess, callback);
  }
}
