import { IUser } from "../../shared/types/user";
import { hashPassword } from "../../server/src/common/auth";
import { IAudit } from "../../shared/types";
import * as fs from "fs";
import { Connection, r, RConnectionOptions, RValue } from "rethinkdb-ts";
import tunnel from "tunnel-ssh";
import { Server } from "net";
import readline from "readline";

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
const env = process.argv[3];

const envData = require("dotenv").config({ path: `env/.env.${env}` }).parsed;

const tablesToImport = datasets[datasetId];

console.log(`***importing dataset ${datasetId}***\n`);

function doIndex(statement: any, connection: any): Promise<any> {
  return new Promise((resolve) => {
    statement.run(connection, resolve);
  });
}

const importData = async () => {
  const config: RConnectionOptions = {
    timeout: 5,
    db: envData.DB_NAME,
    host: envData.DB_HOST,
    port: envData.DB_PORT,
    password: process.env.DB_AUTH,
    tables: tablesToImport,
  };

  let conn: Connection;
  console.log(config);

  try {
    conn = await r.connect(config);
  } catch (e) {
    throw new Error(`Cannot connect to the db: ${e}`);
  }

  // Drop the database.
  try {
    await r.dbDrop(config.db as RValue<string>).run(conn);
    console.log("Database dropped");
  } catch (e) {
    throw new Error(`Database not dropped: ${e}`);
  }

  // Recreate the database
  try {
    await r.dbCreate(config.db as RValue<string>).run(conn);
    console.log("Database created");
  } catch (e) {
    throw new Error(`Database not created: ${e}`);
  }

  // set default database
  conn.use(config.db as string);

  // Insert data to tables.
  for (let i = 0; i < config.tables.length; ++i) {
    const table = config.tables[i];

    await r.tableCreate(table.name).run(conn);
    if (table.indexes) {
      for (const index of table.indexes) {
        //await doIndex(index, conn);
      }
    }

    console.log(`Table ${table.name} created`);

    let data = JSON.parse(fs.readFileSync(table.data).toString());
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

    await r.table(table.name).insert(data).run(conn);

    if (table.name === "entities") {
      const entitiesImported = await r.table("entities").count().run(conn);
      console.log(`Imported ${entitiesImported} entities`);
    }
  }

  console.log("Closing connection");
  await conn.close({ noreplyWait: true });
};

(async () => {
  if (envData.SSH_USERNAME) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Using the tunnel. Continue? y/n\n", function (result) {
      if (result.toLowerCase() !== "y") {
        process.exit(0);
      }

      const tnl = tunnel(
        {
          host: envData.SSH_IP,
          dstPort: 28015,
          localPort: envData.DB_PORT,
          username: envData.SSH_USERNAME,
          password: envData.SSH_PASSWORD,
        },
        async (error: Error, srv: Server) => {
          try {
            await importData();
          } catch (e) {
            console.warn(e);
          } finally {
            await srv.close();
          }
        }
      );

      tnl.on("error", function (err) {
        console.error("SSH connection error:", err);
      });
    });
  } else {
    try {
      await importData();
    } catch (e) {
      console.warn(e);
    }
  }
})();
