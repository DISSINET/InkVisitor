
const { table } = require("console");
const fs = require("fs");
const r = require("rethinkdb");

const config = {
    db: "dissinet",
    host: "localhost",
    port: 28015,
    tables: [{
        name: "actants",
        path: "import/import_data/mock-nosql/actants.json"
    }, {
        name: "actions",
        path: "import/import_data/mock-nosql/actions.json"
    }]
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------
const load = async () => {
    let conn = null;

    try {
        conn = await r.connect(config);

        const db = ""

        // Possible steps:
        // - drop database if exists
        // - create a new database
        //   or drop tables only

        // Recreate the database.
        await r.dbDrop(config.db).run(conn);
        await r.dbCreate(config.db).run(conn);

        // Insert data to tables.
        for (let i = 0; i < config.tables.length; ++i) {
            const table = config.tables[i]

            await r.tableCreate(table.name).run(conn);
            await console.log(table.name);

            const data = JSON.parse(fs.readFileSync(table.path))
            await console.log(data);

            await r.table(table.name).insert(data).run(conn);
        }

    } catch (error) {
        console.log(error);

    } finally {
        console.log("closing");
        if (conn) {
            conn.close()
        }
    }
}

load();