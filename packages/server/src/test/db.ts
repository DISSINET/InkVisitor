import { Conn, storage } from "../service/storage";

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
 * Dedicated connection to the test database for setup/teardown work. Short
 * timeout so a missing database server surfaces quickly instead of hanging
 * the whole run.
 */
export function openTestDb(): Promise<Conn> {
  return storage.openConnection({ db: getTestDbName(), timeoutSeconds: 5 });
}

export function closeTestDb(conn: Conn): Promise<void> {
  return storage.closeConnection(conn, { noreplyWait: false });
}
