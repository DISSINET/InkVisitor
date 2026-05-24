const tsconfig = require("./tsconfig.json");

const paths = Object.keys(tsconfig.compilerOptions.paths).reduce(
  (prev, curr) => {
    // alias prefix without the trailing "/*" (handles multi-segment names like "@inkvisitor/shared")
    const prefix = curr.replace(/\/\*$/, "");
    const rootDirPath = `<rootDir>/${tsconfig.compilerOptions.paths[
      curr
    ][0].replace("*", "$1")}`;
    // because in tsconfig we set ./src as baseUrl, we need to go one directory back
    const adjustedPath = rootDirPath.replace("../", "");
    prev[`${prefix}/(.*)`] = adjustedPath;
    return prev;
  },
  {}
);

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: paths,
};
