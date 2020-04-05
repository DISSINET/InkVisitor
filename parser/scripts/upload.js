var neo4j = require("neo4j-driver");
var config = require("./../config.json").neo4j.local;

const { replaceAll } = require("./../util/base");

// setting the driver
var driver = neo4j.driver(
  "bolt://" + config.host,
  neo4j.auth.basic(config.username, config.password)
);

const objectToText = (obj, removeAttrs = []) => {
  // remove attributes from object
  let objWithoutRemoved = {};
  Object.keys(obj).forEach(key => {
    if (!removeAttrs.includes(key)) {
      objWithoutRemoved[key] = obj[key];
    }
  });

  objWithoutRemoved.data = replaceAll(objWithoutRemoved.data, ['"'], '\\"');
  objWithoutRemoved.data = replaceAll(objWithoutRemoved.data, ["\\"], "");

  // handle object as text
  let asText = JSON.stringify(objWithoutRemoved);
  const keys = Object.keys(objWithoutRemoved);
  keys.forEach(key => {
    asText = asText.replace('"' + key + '":', key + ":");
  });
  return asText;
};

/*
 * take query and run it on db
 */
async function runQuery(query, params = {}) {
  const session = driver.session({
    defaultAccessMode: neo4j.session.WRITE
  });
  const result = await session.run(query, params).catch(e => {
    console.log(e);
  });
  session.close();
  if (!result || !result.records || result.records.length === 0) {
    return false;
  }
  return result.records[0].get(0);
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const sanitizeId = id => {
  return replaceAll(id, ["-"], "_");
};

/*
 * take nodes and edges and upload them to neo4j server
 */
module.exports = async function upload(nodes, edges) {
  // remove everything
  await runQuery("MATCH (n) DETACH DELETE n");

  let nodesFinished = 0;
  const nodesAll = nodes.length;

  await asyncForEach(nodes, async node => {
    node.id = sanitizeId(node.id);
    //delete node.id;

    // inform about progress
    nodesFinished += 1;
    if (!(nodesFinished % 100)) {
      console.log(
        "uploading nodes to db",
        nodesFinished + "/" + nodesAll,
        (nodesFinished / nodesAll) * 100 + "%"
      );
    }

    // process node attributes
    const nodeAsText = objectToText(node, []);

    // create node query
    const query = `CREATE (a:${node.entity} ` + nodeAsText + ") RETURN a";

    await runQuery(query);
  });

  let edgesFinished = 0;
  const edgesAll = edges.length;

  await asyncForEach(edges, async edge => {
    // process id values
    const fromId = sanitizeId(edge.from);
    const toId = sanitizeId(edge.to);

    // process edge attributes
    const edgeAsText = objectToText(edge, ["from", "to", "type"]);

    // create relationship between `from` and `to` nodes
    await runQuery(
      `MATCH (a), (b) WHERE a.id ='${fromId}' AND b.id = '${toId}' CREATE (a)-[r:${edge.type} ` +
        edgeAsText +
        "]->(b)"
    );

    // inform about progress
    edgesFinished += 1;
    if (!(edgesFinished % 100)) {
      console.log(
        "uploading edges to db",
        edgesFinished + "/" + edgesAll,
        (edgesFinished / edgesAll) * 100 + "%"
      );
    }
  });

  driver.close();
};
