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
