import { Connection, r } from "rethinkdb-ts";

/**
 * A database name is only safe for the test suite if it is unmistakably a
 * disposable test DB. Mirror of TEST_DB_PATTERN in src/service/shorthands.ts.
 */
export const TEST_DB_PATTERN = /(^iv_test_)|(_test$)|(^test_)/i;

/**
 * The database the test run owns. Read from process.env.DB_NAME, which
 * jest.config.js populates from env/.env.test (and which CI may override with a
 * unique per-run name). Throws loudly if it is not clearly a test DB, so the
 * suite can never create/drop/seed a real database. globalSetup drops and
 * recreates exactly this name.
 */
export function getTestDbName(): string {
  const name = process.env.DB_NAME || "";
  if (!TEST_DB_PATTERN.test(name)) {
    throw new Error(
      `Refusing to run tests against non-test database "${name}". ` +
        `DB_NAME must match ${TEST_DB_PATTERN} (e.g. inkvisitor_test). ` +
        `Check packages/server/env/.env.test or your shell environment.`
    );
  }
  return name;
}

/**
 * Raw rethinkdb-ts connection used by globalSetup/globalTeardown to administer
 * the test database (drop/create/provision). Deliberately does NOT pass a `db`,
 * so it can create the database before using it. Short timeout so a missing
 * RethinkDB surfaces quickly instead of hanging the whole run.
 */
export async function connectAdmin(): Promise<Connection> {
  return r.connect({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 28015,
    password: process.env.DB_AUTH || undefined,
    timeout: 5,
  });
}
