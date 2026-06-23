const tsconfig = require("./tsconfig.json");

const dotenv = require("dotenv");
// override: true so a value exported in the developer's shell (e.g. a stray
// DB_NAME=inkvisitor) cannot leak past the test env and re-arm the data-loss
// footgun. The .env.test file is authoritative for the test run.
const dotenvResult = dotenv.config({ path: "./env/.env.test", override: true });
if (dotenvResult.error) {
  throw dotenvResult.error;
}

const paths = Object.keys(tsconfig.compilerOptions.paths).reduce(
  (prev, curr) => {
    // alias prefix without the trailing "/*" (handles multi-segment names like "@inkvisitor/shared")
    const prefix = curr.replace(/\/\*$/, "");
    prev[`${prefix}/(.*)`] = `<rootDir>/${tsconfig.compilerOptions.paths[
      curr
    ][0].replace("*", "$1")}`;
    return prev;
  },
  {
    uuid: require.resolve("uuid"),
  }
);

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: paths,
  // Hung pool acquires wait on the 10s pool timeout; cap the whole test well
  // above that so a stuck DB call fails loudly instead of hanging the run.
  testTimeout: 30000,
  // TEMPORARY (remove in Phase 1): the suite leaks connections (hand-rolled
  // `new Db()` instances and a module-level pool that isn't always closed),
  // which keeps Jest workers alive after tests finish. forceExit prevents the
  // run from hanging until per-test teardown is centralized in globalTeardown.
  forceExit: true,
};
