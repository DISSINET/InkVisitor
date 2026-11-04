import session from "express-session";
import { Conn, DbPool, SessionRow, storage } from "@service/storage";

export async function ensureSessionsTable(conn: Conn): Promise<void> {
  await storage.sessions.ensure(conn);
}

export async function invalidateUserSessions(
  conn: Conn,
  userId: string
): Promise<void> {
  await storage.sessions.deleteByUser(conn, userId);
}

/**
 * Deletes every session whose expiry has already passed. The store also removes
 * expired rows lazily on get(), but a session that is never accessed again would
 * otherwise linger forever - this sweep reclaims those.
 * @returns number of rows removed
 */
export function reapExpiredSessions(conn: Conn): Promise<number> {
  return storage.sessions.deleteExpired(conn, Date.now());
}

export class StorageSessionStore extends session.Store {
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

  private async withConn<T>(fn: (conn: Conn) => Promise<T>): Promise<T> {
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
          const row = await storage.sessions.get(conn, sid);

          if (!row || row.expiresAt <= Date.now()) {
            if (row) {
              await storage.sessions.delete(conn, sid);
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
      .then(() => this.withConn((conn) => storage.sessions.set(conn, row)))
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  destroy(sid: string, callback?: (err?: unknown) => void): void {
    this.ensureReady()
      .then(() => this.withConn((conn) => storage.sessions.delete(conn, sid)))
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
