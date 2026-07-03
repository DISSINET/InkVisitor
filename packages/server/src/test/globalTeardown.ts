import { r } from "rethinkdb-ts";
import { connectAdmin, getTestDbName } from "./db";

/**
 * Jest globalTeardown. Drops the ephemeral test database created in
 * globalSetup. Tolerant of a missing DB / unreachable server (the run may have
 * skipped provisioning), so teardown never turns a green run red.
 */
export default async function globalTeardown(): Promise<void> {
  let dbName: string;
  try {
    dbName = getTestDbName();
  } catch {
    return;
  }

  let conn;
  try {
    conn = await connectAdmin();
  } catch {
    return;
  }

  try {
    await r.dbDrop(dbName).run(conn).catch(() => undefined);
  } finally {
    await conn.close();
  }
}
