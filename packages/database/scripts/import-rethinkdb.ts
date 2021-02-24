import * as fs from "fs";
import { IUser } from "../../shared/types/user";
import { hashPassword } from "../../server/src/common/auth";
const r = require("rethinkdb");
const tunnel = require("tunnel-ssh");

const datasets: Record<string, any> = {
  mock: [
    {
      name: "actants",
      path: "import/mock/actants.json",
    },
    {
      name: "actions",
      path: "import/mock/actions.json",
    },
    {
      name: "users",
      path: "import/mock/users.json",
    },
  ],
  sellan: [
    {
      name: "actants",
      path: "import/sellan/actants.json",
    },
    {
      name: "actions",
      path: "import/sellan/actions.json",
    },
  ],
  all: [
    {
      name: "actants",
      path: "import/all/actants.json",
    },
    {
      name: "actions",
      path: "import/all/actions.json",
    },
  ],
};
const datasetId = process.argv[2];
const dbMode = process.argv[3];

const envData = require("dotenv").config({ path: `env/.env.${dbMode}` }).parsed;

const tablesToImport = datasets[datasetId];

console.log(dbMode, envData);

console.log(`***importing dataset ${datasetId}***`);
console.log("");

const dictionaries: Record<string, string> = {
  //certainties: "import/dictionaries/dict_certainties.json",
  // elvls: "import/dictionaries/dict_elvls.json",
  // languages: "import/dictionaries/dict_languages.json",
  //modalities: "import/dictionaries/dict_modalities.json",
  // positions: "import/dictionaries/dict_positions.json",
  // referencetypes: "import/dictionaries/dict_referencetypes.json",
  // resourcetypes: "import/dictionaries/dict_resourcetypes.json",
  // territorytypes: "import/dictionaries/dict_territorytypes.json",
};

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

const importData = async () => {
  const config = {
    db: envData.DB_NAME,
    host: envData.DB_HOST,
    port: envData.DB_PORT,
    tables: tablesToImport,
  };

  let conn = null;

  try {
    conn = await r.connect(config);

    console.log(config);

    // Drop the database.
    try {
      await r.dbDrop(config.db).run(conn);
      console.log("database dropped");
    } catch (e) {
      console.log("database not dropped");
    }

    // Recreate the database
    try {
      await r.dbCreate(config.db).run(conn);
      console.log("database created");
    } catch (e) {
      console.log("database not created");
    }

    // default database
    conn.use(config.db);

    // Insert dictionaries
    const dictionaryKeys = Object.keys(dictionaries);
    for (let i = 0; i < dictionaryKeys.length; i++) {
      const dictionaryPath = dictionaries[dictionaryKeys[i]];
      const dictionaryData = JSON.parse(
        fs.readFileSync(dictionaryPath).toString()
      );
      const tableName = `dict_${dictionaryKeys[i]}`;
      await r.tableCreate(tableName).run(conn);
      await r.table(tableName).insert(dictionaryData).run(conn);
      await console.log(`data into the dictionary ${tableName} inserted`);
    }

    // Insert data to tables.
    for (let i = 0; i < config.tables.length; ++i) {
      const table = config.tables[i];

      await r.tableCreate(table.name).run(conn);
      await console.log(`table ${table.name} created`);

      let data = JSON.parse(fs.readFileSync(table.path).toString());
      if (table.name === "users") {
        data = data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          return user;
        });
      }

      await r.table(table.name).insert(data).run(conn);
      await console.log(`data into the table ${table.name} inserted`);
    }
  } catch (error) {
    console.log(error);
  } finally {
    console.log("closing connection");
    if (conn) {
      conn.close();
    }
  }
};

if (dbMode == "remote") {
  const tnl = tunnel(
    {
      host: envData.SSH_IP,
      port: 28015,
      dstPort: 28017,
      username: envData.SSH_USERNAME,
      password: envData.SSH_LOGIN,
    },
    function (error: any, tnl: any) {
      console.log("in the tunnel");
      importData();
      tnl.close();
    }
  );
} else {
  importData();
}
