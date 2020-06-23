//var { upload } = require("./upload.js");
var { parse } = require("./parse.js");

var fs = require("fs");

var load = async () => {
  /*
   * guglielmites dataset
   */
  [nodes, edges] = await parse(["T107"]);

  fs.writeFileSync("nodes.json", JSON.stringify(nodes));
  fs.writeFileSync("edges.json", JSON.stringify(edges));

  /*
   * send nodes and edges to upload function
   */
  //await upload(nodes, edges);
};

load();
