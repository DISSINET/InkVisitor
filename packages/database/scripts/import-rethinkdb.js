const { table } = require("console");
const fs = require("fs");
const r = require("rethinkdb");

const datasets = {
  mock: [
    {
      name: "actants",
      path: "import/mock/actants.json",
    },
    {
      name: "actions",
      path: "import/mock/actions.json",
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
const tablesToImport = datasets[datasetId];
console.log(`***importing database ${datasetId}***`);
console.log("");

const config = {
  db: "dissinet",
  host: "localhost",
  port: 28015,
  tables: tablesToImport,
};

const dictionaries = {
  certainties: "import/dictionaries/dict_certainties.json",
  elvls: "import/dictionaries/dict_elvls.json",
  languages: "import/dictionaries/dict_languages.json",
  modalities: "import/dictionaries/dict_modalities.json",
  positions: "import/dictionaries/dict_positions.json",
  referencetypes: "import/dictionaries/dict_referencetypes.json",
  resourcetypes: "import/dictionaries/dict_resourcetypes.json",
  territorytypes: "import/dictionaries/dict_territorytypes.json",
};

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------
const load = async () => {
  let conn = null;

  try {
    conn = await r.connect(config);

    // Drop the database.
    try {
      await r.dbDrop(config.db).run(conn);
      console.log("database dropped");
    } catch (e) {
      console.log("database not dropped", e);
    }

    // Recreate the database
    try {
      await r.dbCreate(config.db).run(conn);
      console.log("database created");
    } catch (e) {
      console.log("database not created", e);
    }

    // Insert dictionaries
    const dictionaryKeys = Object.keys(dictionaries);
    for (let i = 0; i < dictionaryKeys.length; i++) {
      const dictionaryPath = dictionaries[dictionaryKeys[i]];
      const dictionaryData = JSON.parse(fs.readFileSync(dictionaryPath));
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

      const data = JSON.parse(fs.readFileSync(table.path));
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

load();
