const { table } = require("console");
const fs = require("fs");
const r = require("rethinkdb");

const config = {
  db: "dissinet",
  host: "localhost",
  port: 28015,
  tables: [
    {
      name: "actants",
      path: "import/mock/actants.json",
    },
    {
      name: "actions",
      path: "import/mock/actions.json",
    },
  ],
};

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------
const load = async () => {
  let conn = null;

  try {
    conn = await r.connect(config);

    const db = "";

    // Possible steps:
    // - drop database if exists
    // - create a new database
    //   or drop tables only

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
    console.log("closing");
    if (conn) {
      conn.close();
    }
  }
};

load();
