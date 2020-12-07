const fs = require("fs-extra");
const childProcess = require("child_process");

var Rsync = require("rsync");

try {
  // Remove current build
  fs.removeSync("./dist/");
  // Copy front-end files
  //fs.copySync("./package.json", "./dist/package.json");
  //fs.copySync("./secret", "./dist/secret");
  //fs.copySync("./env", "./dist/env");
  // Transpile the typescript files
  childProcess.exec("tsc --build tsconfig.prod.json", {}, () => {
    console.log("build finished");
    var rsync = new Rsync()
      .shell("ssh")
      .flags("avz")
      .source("dist")
      .source("secret")
      .source("env")
      .source("package.json")
      .destination("adamm@10.16.30.211:/var/www/html/apps/inkvisitor/server");

    rsync.execute(function (error, code, cmd) {
      console.log("moved to server");
    });
  });
} catch (err) {
  console.log(err);
}
