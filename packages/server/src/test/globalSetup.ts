import { storage } from "../service/storage";
import { closeTestDb, getTestDbName, openTestDb } from "./db";
import { adminSeed } from "./fixtures";

/**
 * Jest globalSetup. Runs once, in the parent process, before any worker forks.
 *
 * Builds the ephemeral test database named by process.env.DB_NAME (a test name,
 * guaranteed by getTestDbName / the assertion in jest.config.js): drop any
 * leftover, create it fresh with all tables + secondary indexes, and seed
 * the admin user. Workers inherit DB_NAME via process.env and connect to this
 * DB through the normal app pool, so tests never touch the real database.
 *
 * If no database server is reachable we warn and return rather than throw, so
 * pure unit tests still run; DB-backed tests then fail individually (safely)
 * when they try to query.
 */
export default async function globalSetup(): Promise<void> {
  const dbName = getTestDbName();

  try {
    await storage.createDatabase(dbName);
  } catch (e) {
    console.warn(
      `[test globalSetup] no database reachable on ` +
        `${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 28015} - ` +
        `DB-backed tests will fail; pure unit tests still run. ` +
        `(${(e as Error).message})`
    );
    return;
  }

  const conn = await openTestDb();
  try {
    await storage.users.insert(conn, adminSeed);
    // Cookie-session auth signs in via POST /users/signin. The ACL layer treats
    // that route as admin-only unless a public permission row exists, so an
    // unauthenticated signin would be denied (403). Production seeds this row;
    // mirror it here so getAuthenticatedAgent (see @modules/testAuth) is reachable
    // in every suite, independent of file execution order. isolate.ts leaves
    // acl_permissions untouched, so this persists for the whole run.
    await storage.acl.insert(conn, {
      id: "signin-public",
      controller: "users",
      method: "POST",
      route: "signin",
      roles: [],
      public: true,
    });

    console.log(`[test globalSetup] provisioned ephemeral test DB "${dbName}"`);
  } finally {
    await closeTestDb(conn);
  }
}
