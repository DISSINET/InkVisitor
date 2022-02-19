import { IUser } from "../../shared/types/user";
import { hashPassword } from "../../server/src/common/auth";
import { IAudit } from "../../shared/types";
const fs = require("fs");
const r = require("rethinkdb");
var tunnel = require("tunnel-ssh");

const entitiesTable = "entities";

const datasets: Record<string, any> = {
  all: [
    {
      name: "acl_permissions",
      data: "datasets/all/acl_permissions.json",
    },
    {
      name: "entities",
      data: "datasets/all/entities.json",
      indexes: [
        r.table(entitiesTable).indexCreate("class"),
        r.table(entitiesTable).indexCreate("label"),
        r
          .table(entitiesTable)
          .indexCreate(
            "data.actants.actant",
            r.row("data")("actants")("actant")
          ),
        r
          .table(entitiesTable)
          .indexCreate(
            "data.actions.action",
            r.row("data")("actions")("action")
          ),
        r.table(entitiesTable).indexCreate("data.tags", r.row("data")("tags")),
        r
          .table(entitiesTable)
          .indexCreate(
            "data.props.type.id",
            r.row("data")("props")("type")("id")
          ),
        r
          .table(entitiesTable)
          .indexCreate(
            "data.props.value.id",
            r.row("data")("props")("value")("id")
          ),
        r
          .table(entitiesTable)
          .indexCreate(
            "data.references.resource",
            r.row("data")("references")("resource")
          ),
        r
          .table(entitiesTable)
          .indexCreate("data.props.origin", r.row("data")("props")("origin")),
        r
          .table(entitiesTable)
          .indexCreate("data.territory.id", r.row("data")("territory")("id")),
        r
          .table(entitiesTable)
          .indexCreate("data.parent.id", r.row("data")("parent")("id")),
      ],
    },
    {
      name: "users",
      data: "datasets/all/users.json",
    },
    {
      name: "audits",
      data: "datasets/all/audits.json",
    },
  ],
};

const datasetId: string = process.argv[2];
const dbMode = process.argv[3];

const envData = require("dotenv").config({ path: `env/.env.${dbMode}` }).parsed;

const tablesToImport = datasets[datasetId];

console.log(`***importing dataset ${datasetId}***`);
console.log("");

function doIndex(statement: any, connection: any): Promise<any> {
  return new Promise((resolve) => {
    statement.run(connection, resolve);
  });
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

const importData = async () => {
  const config = {
    db: envData.DB_NAME,
    host: envData.DB_HOST,
    port: envData.DB_PORT,
    password: process.env.DB_AUTH,
    tables: tablesToImport,
  };

  let conn: any = null;

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

    // set default database
    conn.use(config.db);

    // Insert data to tables.
    for (let i = 0; i < config.tables.length; ++i) {
      const table = config.tables[i];

      r.tableCreate(table.name).run(conn, async () => {
        if (table.indexes) {
          for (const index of table.indexes) {
            //await doIndex(index, conn);
          }
        }

        console.log(`table ${table.name} created`);

        let data = JSON.parse(fs.readFileSync(table.data));
        if (table.name === "users") {
          data = data.map((user: IUser) => {
            user.password = hashPassword(user.password ? user.password : "");
            return user;
          });
        }

        if (table.name === "audits") {
          data = data.map((audit: IAudit) => {
            audit.date = new Date(audit.date);
            return audit;
          });
        }

        r.table(table.name)
          .insert(data)
          .run(conn, () => {
            if (table.name === "entities") {
              r.table("entities").run(conn, (err: any, cursor: any) => {
                cursor.toArray().then((results: any) => {
                  console.log(`number of entities imported ${results.length}`);
                });

                //console.log(`data into the table ${table.name} inserted`);
              });
            }
          });
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    console.log("closing connection");
    if (conn) {
      // TODO  this is bad
      setTimeout(() => {
        conn.close();
      }, 5000);
    }
  }
};

if (dbMode == "prod") {
  const tnl = tunnel(
    {
      host: envData.SSH_IP,
      port: 28015,
      dstPort: 28017,
      username: envData.SSH_USERNAME,
      password: envData.SSH_PASSWORD,
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
