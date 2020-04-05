import neo4j from "neo4j-driver";

import { replaceAll } from "../../common/util/base";

var driver = neo4j.driver(
  "bolt://0.0.0.0:7687",
  neo4j.auth.basic("neo4j", "test")
);

server.listen(3003, "0.0.0.0").then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
