const tsconfig = require("./tsconfig.json");

const paths = Object.keys(tsconfig.compilerOptions.paths).reduce(
  (prev, curr) => {
    const split = curr.split("/");
    const rootDirPath = `<rootDir>/${tsconfig.compilerOptions.paths[
      curr
    ][0].replace("*", "$1")}`;
    // because in tsconfig we set ./src as baseUrl, we need to go one directory back
    const adjustedPath = rootDirPath.replace("../", "");
    prev[`${split[0]}/(.*)`] = adjustedPath;
    return prev;
  },
  {}
);

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: paths,
};
