var { upload } = require("./upload.js");
var { parse } = require("./parse.js");

var load = async () => {
  /*
   * guglielmites dataset
   */
  [nodes, edges] = await parse(["T107"]);

  /*
   * send nodes and edges to upload function
   */
  await upload(nodes, edges);
};

load();
