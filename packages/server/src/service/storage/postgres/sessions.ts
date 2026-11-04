import { SessionRow, SessionStore } from "../types";
import { query } from "./conn";
import { SESSIONS_DDL } from "./provision";
import { encode } from "./sql";

/**
 * Same jsonb layout as every other table, with generated columns user_id and
 * expires_at, each indexed. The DDL is idempotent, so ensure() runs it on every start.
 */
export const sessions: SessionStore = {
  async ensure(conn) {
    for (const statement of SESSIONS_DDL) {
      await query(conn, statement);
    }
  },

  async get(conn, sid) {
    const res = await query(conn, `SELECT doc FROM sessions WHERE id = $1`, [sid]);
    return res.rows.length ? (res.rows[0].doc as SessionRow) : null;
  },

  async set(conn, row) {
    await query(
      conn,
      `INSERT INTO sessions (doc) VALUES ($1::jsonb) ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc`,
      [encode(row)]
    );
  },

  async delete(conn, sid) {
    await query(conn, `DELETE FROM sessions WHERE id = $1`, [sid]);
  },

  async deleteByUser(conn, userId) {
    await query(conn, `DELETE FROM sessions WHERE user_id = $1`, [userId]);
  },

  async deleteExpired(conn, now) {
    // the expires_at index makes this a bounded range delete rather than a full
    // table scan (expiresAt is an epoch-ms timestamp)
    const res = await query(conn, `DELETE FROM sessions WHERE expires_at <= $1`, [now]);
    return res.rowCount ?? 0;
  },
};
