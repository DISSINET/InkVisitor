import { r } from "rethinkdb-ts";
import { connectAdmin, getTestDbName } from "./db";

/**
 * Per-file test isolation (setupFilesAfterEnv).
 *
 * Registered before each test file, so this root-level beforeAll runs once per
 * file, BEFORE that file's own beforeAll hooks. It empties the mutable entity
 * tables so no suite inherits another suite's leftover rows — leftovers made
 * table-scanning queries and territory-tree building (createTree) intermittently
 * fail across the shared test database.
 *
 * The seeded admin (users) plus settings/acl_permissions are preserved, so auth
 * and the admin token keep working. Tolerant of a missing/unreachable DB so a
 * pure-unit run without RethinkDB is unaffected.
 */
const MUTABLE_TABLES = ["entities", "relations", "audits", "documents"];

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
  } finally {
    await conn.close();
  }
});
