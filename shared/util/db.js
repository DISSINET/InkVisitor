var neo4j = require("neo4j-driver");
var db = require("../config/db.json").local;

// setting the driver
var driver = false;

var getDriver = () => {
  if (!driver) {
    driver = neo4j.driver(
      "bolt://" + db.host,
      neo4j.auth.basic(db.username, db.password),
      { disableLosslessIntegers: true }
    );
  }
  return driver;
};

var newSession = (accessMode = "write") => {
  const sessionDriver = getDriver();
  const session = sessionDriver.session({
    defaultAccessMode:
      accessMode === "write" ? neo4j.session.WRITE : neo4j.session.READ,
  });
  return session;
};

exports.close = function () {
  driver = getDriver();
  driver.close();
  driver = false;
};

const parseRecord = (recordData) => {
  if (recordData) {
    const props = recordData.properties;

    if (props) {
      return props;
    } else {
      return recordData;
    }
  }
  return false;
};

/*
 * take query and run it on db
 */
exports.runQuery = async function (query, params = {}) {
  const session = newSession();
  const result = await session.run(query, params).catch((e) => {
    console.log(e);
  });

  if (!result || !result.records || result.records.length === 0) {
    return false;
  }
  return result.records.map((recordRaw) => {
    const record = recordRaw.toObject();
    let recordOut = {};
    const keys = Object.keys(record);
    if (keys.length > 1) {
      keys.forEach((recordKey) => {
        recordOut[recordKey] = parseRecord(record[recordKey]);
      });
    } else {
      recordOut = parseRecord(record[keys[0]]);
    }
    return recordOut;
  });
};
