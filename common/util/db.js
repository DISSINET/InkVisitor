var neo4j = require("neo4j-driver");
var db = require("./../../common/config/db.json").local;

// setting the driver
var driver = false;

var getDriver = () => {
  if (!driver) {
    driver = neo4j.driver(
      "bolt://" + db.host,
      neo4j.auth.basic(db.username, db.password)
    );
  }
  return driver;
};

exports.close = function() {
  driver = getDriver();
  driver.close();
};

/*
 * take query and run it on db
 */
exports.runQuery = async function(query, params = {}) {
  driver = getDriver();
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
};
