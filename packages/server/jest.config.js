const tsconfig = require("./tsconfig.json");

const dotenv = require("dotenv");
const dotenvResult = dotenv.config({ path: "./env/.env.test" });
if (dotenvResult.error) {
  throw dotenvResult.error
}

const paths = Object.keys(tsconfig.compilerOptions.paths).reduce(
  (prev, curr) => {
    const split = curr.split("/");
    prev[`${split[0]}/(.*)`] = `<rootDir>/${tsconfig.compilerOptions.paths[
      curr
    ][0].replace("*", "$1")}`;
    return prev;
  },
  {}
);

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: paths,
};
