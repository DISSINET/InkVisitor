import { r } from "rethinkdb-ts";
import { SessionRow, SessionStore } from "../types";
import { unwrap } from "./conn";
import { TABLE } from "./tables";

export const sessions: SessionStore = {
  async ensure(conn) {
    const tables = (await r.tableList().run(unwrap(conn))) as string[];
    if (tables.includes(TABLE.sessions)) {
      return;
    }

    await r.tableCreate(TABLE.sessions).run(unwrap(conn));
    await r.table(TABLE.sessions).indexCreate("userId").run(unwrap(conn));
    await r.table(TABLE.sessions).indexCreate("expiresAt").run(unwrap(conn));
    console.log(`[startup] created RethinkDB table ${TABLE.sessions}`);
  },

  async get(conn, sid) {
    return ((await r.table(TABLE.sessions).get(sid).run(unwrap(conn))) as SessionRow | null) ?? null;
  },

  async set(conn, row) {
    await r.table(TABLE.sessions).insert(row, { conflict: "replace" }).run(unwrap(conn));
  },

  async delete(conn, sid) {
    await r.table(TABLE.sessions).get(sid).delete().run(unwrap(conn));
  },

  async deleteByUser(conn, userId) {
    await r
      .table(TABLE.sessions)
      .getAll(userId, { index: "userId" })
      .delete()
      .run(unwrap(conn));
  },

  async deleteExpired(conn, now) {
    // the expiresAt index makes this a bounded range delete rather than a full
    // table scan (expiresAt is an epoch-ms timestamp, so 0 is a safe lower bound)
    const result = await r
      .table(TABLE.sessions)
      .between(0, now, { index: "expiresAt", rightBound: "closed" })
      .delete()
      .run(unwrap(conn));
    return result.deleted ?? 0;
  },
};
