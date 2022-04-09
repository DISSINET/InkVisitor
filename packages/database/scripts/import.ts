import { IUser } from "../../shared/types/user";
import { hashPassword } from "../../server/src/common/auth";
import { IAudit } from "../../shared/types";
import {
  r,
  RConnectionOptions,
  RTable,
  Connection,
  RDatum,
  RValue,
} from "rethinkdb-ts";
import tunnel from "tunnel-ssh";
import { Server } from "net";
import readline from "readline";
import { parseArgs, prepareDbConnection, TableSchema } from "./import-utils";
import { DbIndex } from "@shared/enums";

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
        // if the prop object is missing value/type/children attrs, this wont work! model should handle this
        (table: RTable) =>
          table.indexCreate(
            "props.recursive",
            r
              .row("props")
              .concatMap((prop: RDatum) =>
                r
                  .expr([prop("value")("id"), prop("type")("id")])
                  .add(
                    prop("children").concatMap((ch1: RDatum) =>
                      r
                        .expr([ch1("value")("id"), ch1("type")("id")])
                        .add(
                          ch1("children").concatMap((ch2: RDatum) =>
                            r
                              .expr([ch2("value")("id"), ch2("type")("id")])
                              .add(
                                ch2("children").concatMap((ch3: RDatum) => [
                                  ch3("value")("id"),
                                  ch3("type")("id"),
                                ]) as RValue
                              )
                          ) as RValue
                        )
                    ) as RValue
                  )
              )
              .distinct(),
            { multi: true }
          ),
        (table: RTable) => table.indexCreate(DbIndex.Class),
        (table: RTable) =>
          table.indexCreate(
            DbIndex.StatementTerritory,
            r.row("data")("territory")("id")
          ),
        /*   (table: RTable) =>
          table.indexCreate(
            DbIndex.DependentStatements,
            r.expr([r.row("data")("territory")("id")]).add(
              r
                .row("data")("actions")
                .concatMap((a: RDatum) => a("action")) as RValue,

              r
                .row("data")("actants")
                .concatMap((a: RDatum) => a("actant")) as RValue,
              r.row("data")("tags")
            ),
            {
              multi: true,
            }
          ),*/
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
