import { IUser } from "../../shared/types/user";
import { hashPassword } from "../../server/src/common/auth";
import { IAudit } from "../../shared/types";
import { r, RConnectionOptions, RTable, Connection } from "rethinkdb-ts";
import tunnel from "tunnel-ssh";
import { Server } from "net";
import readline from "readline";
import { parseArgs, prepareDbConnection, TableSchema } from "./import-utils";

const [datasetId, env] = parseArgs();
const envData = require("dotenv").config({ path: `env/.env.${env}` }).parsed;

const datasets: Record<string, TableSchema[]> = {
  all: [
    {
      name: "acl_permissions",
      data: require("../datasets/all/acl_permissions.json"),
      transform: function () {},
    },
    {
      name: "entities",
      data: require("../datasets/all/entities.json"),
      transform: function () {},
      indexes: [
        (table: RTable) => table.indexCreate("class"),
        (table: RTable) => table.indexCreate("label"),
        (table: RTable) =>
          table.indexCreate(
            "data.actants.actant",
            r.row("data")("actants")("actant")
          ),
        (table: RTable) =>
          table.indexCreate(
            "data.actions.action",
            r.row("data")("actions")("action")
          ),
        (table: RTable) =>
          table.indexCreate("data.tags", r.row("data")("tags")),
        (table: RTable) =>
          table.indexCreate(
            "data.props.type.id",
            r.row("data")("props")("type")("id")
          ),
        (table: RTable) =>
          table.indexCreate(
            "data.props.value.id",
            r.row("data")("props")("value")("id")
          ),
        (table: RTable) =>
          table.indexCreate(
            "data.references.resource",
            r.row("data")("references")("resource")
          ),
        (table: RTable) =>
          table.indexCreate(
            "data.props.origin",
            r.row("data")("props")("origin")
          ),
        (table: RTable) =>
          table.indexCreate(
            "data.territory.id",
            r.row("data")("territory")("id")
          ),
        (table: RTable) =>
          table.indexCreate("data.parent.id", r.row("data")("parent")("id")),
      ],
    },
    {
      name: "users",
      data: require("../datasets/all/users.json"),
      transform: function () {
        this.data = this.data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          return user;
        });
      },
    },
    {
      name: "audits",
      data: require("../datasets/all/audits.json"),
      transform: function () {
        this.data = this.data.map((audit: IAudit) => {
          audit.date = new Date(audit.date);
          return audit;
        });
      },
    },
  ],
};

const config: RConnectionOptions & { tables: TableSchema[] } = {
  timeout: 5,
  db: envData.DB_NAME,
  host: envData.DB_HOST,
  port: envData.DB_PORT,
  password: process.env.DB_AUTH,
  tables: datasets[datasetId],
};

const importTable = async (
  table: TableSchema,
  conn: Connection
): Promise<void> => {
  await r.tableCreate(table.name).run(conn);
  if (table.indexes) {
    for (const i in table.indexes) {
      await table.indexes[i](r.table(table.name)).run(conn);
    }
  }

  console.log(`Table ${table.name} created`);

  await r.table(table.name).insert(table.data).run(conn);

  const itemsImported = await r.table(table.name).count().run(conn);
  console.log(`Imported ${itemsImported} entries to table ${table.name}`);

  return;
};

const importData = async () => {
  const conn = await prepareDbConnection(config);

  console.log(`***importing dataset ${datasetId}***\n`);

  for (const table of config.tables) {
    await importTable(table, conn);
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
