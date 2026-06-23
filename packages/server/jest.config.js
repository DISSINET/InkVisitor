const tsconfig = require("./tsconfig.json");

const dotenv = require("dotenv");
// Load the test env in the parent process; workers inherit it via fork.
// NOTE: this repo's dotenv (v8) never overwrites an already-set process.env
// key and ignores `override`, so a var exported in the shell or by CI wins
// over .env.test. That is intentional - it lets CI inject a unique per-run
// DB_NAME. The hard gate below (not `override`) is what guarantees a normal
// `jest` run can never target a non-test database.
const dotenvResult = dotenv.config({ path: "./env/.env.test" });
if (dotenvResult.error) {
  throw dotenvResult.error;
}

// Hard safety gate: refuse to run the suite unless DB_NAME is unmistakably a
// disposable test database. Fails the entire run early - before globalSetup,
// before any test - rather than relying on the per-wipe guard in
// src/service/shorthands.ts. Mirror of TEST_DB_PATTERN there.
const TEST_DB_PATTERN = /(^iv_test_)|(_test$)|(^test_)/i;
if (!TEST_DB_PATTERN.test(process.env.DB_NAME || "")) {
  throw new Error(
    `Refusing to run tests: DB_NAME="${process.env.DB_NAME || ""}" is not a ` +
      `test database (must match ${TEST_DB_PATTERN}, e.g. inkvisitor_test). ` +
      `Check packages/server/env/.env.test or your shell environment.`
  );
}

const paths = Object.keys(tsconfig.compilerOptions.paths).reduce(
  (prev, curr) => {
    // alias prefix without the trailing "/*" (handles multi-segment names like "@inkvisitor/shared")
    const prefix = curr.replace(/\/\*$/, "");
    // Anchor with ^ so the alias only matches imports that START with it - matching
    // TypeScript's path semantics. Without the anchor, "src/(.*)" matches ANY
    // request containing "src/" (e.g. a dependency's own "./src/index"), which
    // silently remaps foreign modules into our src/ tree.
    prev[`^${prefix}/(.*)$`] = `<rootDir>/${tsconfig.compilerOptions.paths[
      curr
    ][0].replace("*", "$1")}`;
    return prev;
  },
  {
    "^uuid$": require.resolve("uuid"),
  }
);

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: paths,
  // Build a fresh, uniquely-provisioned ephemeral test DB once per run and drop
  // it afterwards, so tests never touch real data. See src/test/.
  globalSetup: "<rootDir>/src/test/globalSetup.ts",
  globalTeardown: "<rootDir>/src/test/globalTeardown.ts",
  // Runs in each worker before any test module is imported; mints TEST_JWT_TOKEN.
  setupFiles: ["<rootDir>/src/test/setup.ts"],
  // Per-file isolation: empties the mutable entity tables before each test file
  // so suites never inherit each other's leftover rows.
  setupFilesAfterEnv: ["<rootDir>/src/test/isolate.ts"],
  // Hung pool acquires wait on the 10s pool timeout; cap the whole test well
  // above that so a stuck DB call fails loudly instead of hanging the run.
  testTimeout: 30000,
  // TEMPORARY (remove once connection leaks are fixed in Phase 3): several
  // suites leak DB connections (hand-rolled `new Db()` instances and a
  // module-level pool that isn't always closed), which keeps Jest workers alive
  // after tests finish.
  forceExit: true,
};
