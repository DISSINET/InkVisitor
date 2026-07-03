import { r } from "rethinkdb-ts";
import { connectAdmin, getTestDbName } from "./db";
import { provisionTables } from "./schema";
import { adminSeed } from "./fixtures";

/**
 * Jest globalSetup. Runs once, in the parent process, before any worker forks.
 *
 * Builds the ephemeral test database named by process.env.DB_NAME (a test name,
 * guaranteed by getTestDbName / the assertion in jest.config.js): drop any
 * leftover, create it fresh, provision all tables + secondary indexes, and seed
 * the admin user. Workers inherit DB_NAME via process.env and connect to this
 * DB through the normal app pool, so tests never touch the real database.
 *
 * If no RethinkDB is reachable we warn and return rather than throw, so pure
 * unit tests still run; DB-backed tests then fail individually (safely) when
 * they try to query.
 */
export default async function globalSetup(): Promise<void> {
  const dbName = getTestDbName();

  let conn;
  try {
    conn = await connectAdmin();
  } catch (e) {
    console.warn(
      `[test globalSetup] no RethinkDB reachable on ` +
        `${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 28015} - ` +
        `DB-backed tests will fail; pure unit tests still run. ` +
        `(${(e as Error).message})`
    );
    return;
  }

  try {
    await r.dbDrop(dbName).run(conn).catch(() => undefined);
    await r.dbCreate(dbName).run(conn);
    conn.use(dbName);

    await provisionTables(conn);
    await r.table("users").insert(adminSeed).run(conn);

    console.log(`[test globalSetup] provisioned ephemeral test DB "${dbName}"`);
  } finally {
    await conn.close();
  }
}
