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
    if (curr === "src/*") {
      return prev;
    }
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

// Pure-unit test files: they pass with NO database reachable (tested
// empirically by running them with the DB port refused). They run in the fast
// "unit" project below, which skips globalSetup/teardown and the per-file DB
// isolation entirely, so they need neither RethinkDB nor a serial run.
// Keep this list in sync when adding a DB-free test; the "integration" project
// runs everything NOT listed here. A misplaced file fails loudly: a real unit
// test left here that needs a DB will fail the DB-free unit run, and an
// integration test added here will too.
const UNIT_TEST_PATHS = [
  "src/common/allowedOrigins.test.ts",
  "src/common/functions.test.ts",
  "src/common/trustProxy.test.ts",
  "src/models/action/action.test.ts",
  "src/models/audit/audit.test.ts",
  "src/models/backup/backup.test.ts",
  "src/models/common.test.ts",
  "src/models/document/anchors.audit.test.ts",
  "src/models/document/anchors.tagdiff.test.ts",
  "src/models/document/anchors.test.ts",
  "src/models/entity/response-search-root-validity.test.ts",
  "src/models/factory.test.ts",
  "src/models/relation/classification.test.ts",
  "src/models/relation/implication.test.ts",
  "src/models/relation/path.test.ts",
  "src/models/relation/related.test.ts",
  "src/models/relation/superordinate-entity.test.ts",
  "src/models/resource/resource.rights.test.ts",
  "src/models/statement/PositionRules.test.ts",
  // No-op own test; its DB-touching exports are only used as helpers elsewhere.
  "src/modules/common.test.ts",
  // Mocks rethinkdb-ts (jest.mock) - evaluateEdges runs against an in-memory proxy.
  "src/service/query/nesting.test.ts",
  "src/models/stats/event-type-fold.test.ts",
  "src/models/stats/hybrid-stats.test.ts",
  "src/models/stats/stats-aggregator.test.ts",
  "src/models/territory/territory.rights.test.ts",
  "src/service/mutex.test.ts",
  "src/service/query/explore-ids-filter.test.ts",
  "src/service/query/explore-label-filter.test.ts",
  "src/service/query/explore-to-request-search.test.ts",
  "src/service/query/query-base-cache.test.ts",
  "src/service/query/results.test.ts",
  "src/service/query/superordinate-edge.test.ts",
  "src/service/ttlCache.test.ts",
];

// Options shared by both projects. Project configs do NOT inherit from the
// root, so each project spreads this.
// Silences noisy app console.log/info/debug during tests (keeps warn/error).
// Set TEST_LOG=1 to opt back in.
const SILENCE_CONSOLE = "<rootDir>/src/test/silenceConsole.ts";

const base = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: paths,
  setupFiles: [SILENCE_CONSOLE],
};

module.exports = {
  // TEMPORARY (remove once connection leaks are fixed): several integration
  // suites leak DB connections (hand-rolled `new Db()` instances and a
  // module-level pool that isn't always closed), which keeps Jest workers alive
  // after tests finish. Global option - applies across projects.
  forceExit: true,
  // Hung pool acquires wait on the 10s pool timeout; cap the whole test well
  // above that so a stuck DB call fails loudly instead of hanging the run.
  // Must live at the top level - jest rejects it inside a `projects` entry.
  testTimeout: 30000,
  projects: [
    {
      ...base,
      displayName: "unit",
      // DB-free: no globalSetup, no per-file isolation. Safe to parallelize
      // (no shared DB), and runnable without RethinkDB - e.g. `jest
      // --selectProjects unit`.
      testMatch: UNIT_TEST_PATHS.map((p) => `<rootDir>/${p}`),
    },
    {
      ...base,
      displayName: "integration",
      // Everything not in the unit list. Needs RethinkDB and a serial run
      // (`--runInBand`) because the workers share one ephemeral test DB.
      testMatch: ["<rootDir>/src/**/*.test.ts"],
      testPathIgnorePatterns: [
        "/node_modules/",
        "/build/",
        ...UNIT_TEST_PATHS.map((p) => p.replace(/\./g, "\\.") + "$"),
      ],
      // Build a fresh, uniquely-provisioned ephemeral test DB once per run and
      // drop it afterwards, so tests never touch real data. See src/test/.
      globalSetup: "<rootDir>/src/test/globalSetup.ts",
      globalTeardown: "<rootDir>/src/test/globalTeardown.ts",
      // (Re-list SILENCE_CONSOLE: this array overrides the one from `base`.)
      // Auth is cookie-session based (see @modules/testAuth), so no per-worker
      // token minting is needed here.
      setupFiles: [SILENCE_CONSOLE],
      // retry.ts: retry the irreducible transport flake (integration only).
      // isolate.ts: restore the globalSetup baseline before each file so suites
      // never inherit each other's leftover rows.
      setupFilesAfterEnv: [
        "<rootDir>/src/test/retry.ts",
        "<rootDir>/src/test/isolate.ts",
      ],
    },
  ],
};
