import { r } from "rethinkdb-ts";
import { connectAdmin, getTestDbName } from "./db";
import { adminSeed } from "./fixtures";

/**
 * Per-file test isolation (setupFilesAfterEnv).
 *
 * Registered before each test file, so this root-level beforeAll runs once per
 * file, BEFORE that file's own beforeAll hooks. It restores the exact baseline
 * that globalSetup produces — all data tables empty, plus the single canonical
 * admin user — so no suite inherits another suite's leftover state.
 *
 * Two leak classes this closes:
 *   1. Data pollution: leftover entities/relations/audits/documents made
 *      table-scanning queries and territory-tree building (createTree)
 *      intermittently fail across the shared test database. Settings is reset
 *      too — globalSetup leaves it empty, but suites (e.g. settings.updateGroup)
 *      write rows that several read paths (warnings/validations/search) consume.
 *   2. Admin state: suites mutate the seeded admin (e.g. users.password changes
 *      its password) or leave extra users behind. Re-seeding the canonical admin
 *      makes auth and the signin flow independent of file execution order.
 *
 * acl_permissions is left untouched: globalSetup seeds none and the suites that
 * need a row (e.g. signin) insert their own in a beforeAll that runs after this.
 * Tolerant of a missing/unreachable DB so a pure-unit run without RethinkDB is
 * unaffected.
 */
const MUTABLE_TABLES = [
  "entities",
  "relations",
  "audits",
  "documents",
  "settings",
];

beforeAll(async () => {
  let conn;
  try {
    conn = await connectAdmin();
  } catch {
    // No RethinkDB reachable (e.g. a unit-only run) - nothing to isolate.
    return;
  }
  try {
    conn.use(getTestDbName());
    for (const table of MUTABLE_TABLES) {
      await r
        .table(table)
        .delete()
        .run(conn)
        .catch(() => undefined); // table may not exist yet
    }
    // Restore the canonical admin: drop every user, then re-insert the seed so
    // id "1" is present, active, and back to its default password regardless of
    // what an earlier file did.
    await r
      .table("users")
      .delete()
      .run(conn)
      .catch(() => undefined);
    await r
      .table("users")
      .insert(adminSeed)
      .run(conn)
      .catch(() => undefined);
  } finally {
    await conn.close();
  }
});
