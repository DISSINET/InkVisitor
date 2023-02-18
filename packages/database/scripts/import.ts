import { IUser } from "../../shared/types/user";
import { hashPassword } from "../../server/src/common/auth";
import { IAudit } from "../../shared/types";
import { Relation } from "../../shared/types/relation";
import { r, RConnectionOptions, Connection, Func } from "rethinkdb-ts";
import tunnel from "tunnel-ssh";
import { confirm } from './import/prompts';
import {
  prepareDbConnection,
  DbSchema,
  TableSchema,
  checkRelation,
} from "./import-utils";
import { auditsIndexes, entitiesIndexes, relationsIndexes } from "./indexes";
import { EntityEnums } from "@shared/enums";
import { question } from "./import/prompts";
import { DbHelper } from "./import/db";
import { getEnv } from "./import/common";
import { ISshConfig, SshHelper, startSshTunnel } from "./import/ssh";
import { Server } from "net";

/*
const datasets: Record<string, DbSchema> = {
  all: {
    users: {
      tableName: "users",
      data: require("../datasets/default/users.json"),
      transform: function () {
        this.data = this.data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          return user;
        });
      },
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: require("../datasets/default/acl_permissions.json"),
      transform: function () { },
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/all/entities.json"),
      transform: function () { },
      indexes: entitiesIndexes,
    },
    audits: {
      tableName: "audits",
      data: require("../datasets/all/audits.json"),
      transform: function () {
        this.data = this.data.map((audit: IAudit) => {
          audit.date = new Date(audit.date);
          return audit;
        });
      },
      indexes: auditsIndexes,
    },
    relations: {
      tableName: "relations",
      data: require("../datasets/all/relations.json"),
      transform: function () {
        this.data = this.data.map((relation: Relation.IRelation) => {
          if (!relation.order) {
            relation.order = 1;
          }
          return relation;
        });
      },
      indexes: relationsIndexes,
    },
  },
  empty: {
    users: {
      tableName: "users",
      data: require("../datasets/default/users.json"),
      transform: function () {
        this.data = this.data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          return user;
        });
      },
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: require("../datasets/default/acl_permissions.json"),
      transform: function () { },
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/empty/entities.json"),
      transform: function () { },
      indexes: entitiesIndexes,
    },
    audits: {
      tableName: "audits",
      data: require("../datasets/empty/audits.json"),
      transform: function () {
        this.data = this.data.map((audit: IAudit) => {
          audit.date = new Date(audit.date);
          return audit;
        });
      },
      indexes: auditsIndexes,
    },
    relations: {
      tableName: "relations",
      data: require("../datasets/empty/relations.json"),
      transform: function () { },
      indexes: relationsIndexes,
    },
  },
  allparsed: {
    users: {
      tableName: "users",
      data: require("../datasets/all-parsed/users.json"),
      transform: function () {
        this.data = this.data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          return user;
        });
      },
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: require("../datasets/default/acl_permissions.json"),
      transform: function () { },
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/all-parsed/entities.json"),
      transform: function () { },
      indexes: entitiesIndexes,
    },
    audits: {
      tableName: "audits",
      data: require("../datasets/all-parsed/audits.json"),
      transform: function () {
        this.data = this.data.map((audit: IAudit) => {
          audit.date = new Date(audit.date);
          return audit;
        });
      },
      indexes: auditsIndexes,
    },
    relations: {
      tableName: "relations",
      data: require("../datasets/all-parsed/relations.json"),
      transform: function () {
        this.data = this.data.map((relation: Relation.IRelation) => {
          if (!relation.order) {
            relation.order = 1;
          }
          return relation;
        });
      },
      indexes: relationsIndexes,
    },
  },
  relationstest: {
    users: {
      tableName: "users",
      data: require("../datasets/default/users.json"),
      transform: function () {
        // get a list of all entities
        const entities = require("../datasets/relationstest/entities.json");
        const allTIds = entities
          .filter((e: any) => e.class === EntityEnums.Class.Territory)
          .map((e: any) => e.id);

        this.data = this.data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          user.rights = user.rights.filter((r: any) =>
            allTIds.includes(r.territory)
          );
          return user;
        });
      },
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: require("../datasets/default/acl_permissions.json"),
      transform: function () { },
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/relationstest/entities.json"),
      transform: function () { },
      indexes: entitiesIndexes,
    },
    audits: {
      tableName: "audits",
      data: require("../datasets/empty/audits.json"),
      transform: function () {
        this.data = this.data.map((audit: IAudit) => {
          audit.date = new Date(audit.date);
          return audit;
        });
      },
      indexes: auditsIndexes,
    },
    relations: {
      tableName: "relations",
      data: require("../datasets/relationstest/relations.json"),
      transform: function () {
        // check validity
        const entities = require("../datasets/relationstest/entities.json");
        const allEntityIds = entities.map((e: any) => e.id);
        this.data = this.data.filter((relation: Relation.IRelation) => {
          return checkRelation(relation, allEntityIds);
        });

        this.data = this.data.map((relation: Relation.IRelation) => {
          if (!relation.order) {
            relation.order = 1;
          }
          return relation;
        });
      },
      indexes: relationsIndexes,
    },
  },
};

const config: RConnectionOptions & { tables: DbSchema; } = {
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
  await r.tableCreate(table.tableName).run(conn);
  if (table.indexes) {
    for (const i in table.indexes) {
      await table.indexes[i](r.table(table.tableName)).run(conn);
    }
  }

  console.log(`Table ${table.tableName} created`);

  table.transform();

  await r.table(table.tableName).insert(table.data).run(conn);

  const itemsImported = await r.table(table.tableName).count().run(conn);
  console.log(`Imported ${itemsImported} entries to table ${table.tableName}`);

  return;
};

const importData = async () => {
  if (!await confirm(`Using db ${config.db}. Continue?`)) {
    return;
  }

  const conn = await prepareDbConnection(config);

  console.log(`***importing dataset ${datasetId}***\n`);

  for (const tableConfig of Object.values(config.tables)) {
    await importTable(tableConfig, conn);
  }

  console.log("Closing connection");
  await conn.close({ noreplyWait: true });
};

(async () => {
  if (envData.SSH_USERNAME) {
    if (!await question(`Using the tunnel. Continue?`)) {
      return;
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
          console.warn(`Encountered error in importData: ${e}`);
        } finally {
          await srv.close();
        }
      }
    );

    tnl.on("error", function (err) {
      console.error("SSH connection error:", err);
    });
  } else {
    try {
      await importData();
    } catch (e) {
      console.warn(e);
    }
  }
})();
*/
enum MODES {
  USE_SSH = 1 << 0,
  RECREATE_DATABASE = 1 << 1,
  IMPORT_DATA = 1 << 2,
}

class Importer {
  mode: MODES = 0;
  db: DbHelper;
  ssh?: SshHelper;

  constructor(initialModes: MODES[]) {
    for (const mode of initialModes) {
      this.mode = this.mode | mode;
    }

    this.db = new DbHelper();
  }

  /**
   * Enables run mode by setting required config bit
   * @param mode 
   */
  enableMode(mode: MODES) {
    this.mode = this.mode | mode;
  }

  /**
   * Predicate for testing if mode has been enabled (if config bit is set)
   * @param mode
   * @returns result
   */
  modeEnabled(mode: MODES): boolean {
    return !!(this.mode & mode);
  }

  /**
   * Starts the lifecycle by initiating the optional ssh connection and mandatory db connection.
   * Then starts polling for user input and doing actions afterwards.
   */
  async run(): Promise<void> {
    if (this.modeEnabled(MODES.USE_SSH) && (await confirm("Use SSH connection?"))) {
      this.ssh = new SshHelper({
        sshIp: getEnv("SSH_IP"),
        sshPassword: getEnv("SSH_PASSWORD"),
        sshUsername: getEnv("SSH_USERNAME"),
        dstPort: this.db.dbConfig.port,
        localPort: this.db.dbConfig.port,
      });
      await this.ssh.startSshTunnel();
    }

    await this.db.connect();

    do {
      await this.selectAction();
    } while (1);
  }

  /**
   * Closes any pending connections, cleanups
   * @returns Promise<void>
   */
  async end(): Promise<void> {
    if (this.ssh) {
      await this.ssh.end();
    }
    await this.db.end();
  }

  /**
   * Shows the main menu and waits for user input
   * @returns Promise<void>
   */
  async selectAction(): Promise<void> {
    let that = this;
    const menu: Record<string, { description: string, action: Function; }> = {
      'L': {
        description: `Press 'L' to switch databases`,
        action: that.selectDb.bind(that)
      },
      'X': {
        description: `Press 'X' to end`,
        action: () => process.exit(0)
      }
    };

    console.log(`\nImport app\n`);
    Object.values(menu).forEach(item => console.log(item.description));

    const actionChoice = await question<string>("", (input: string): string | undefined => { return Object.keys(menu).find(key => key === input); }, "");
    return menu[actionChoice].action();
  }

  /**
   * Action which asks which db should be used in the following session
   * @returns Promise<void>
   */
  async selectDb(): Promise<void> {
    const dbNames = await this.db.dbList();
    console.log(`Databases: ${["", ...dbNames.map((name, i) => `${name} (${i + 1})}`)].join("\n- ")}`);

    const dbName = await question<string>("Choose the db (name/number)", (input: string): string | undefined => {
      if (parseInt(input) > 0) {
        input = dbNames[parseInt(input) - 1];
      }

      return dbNames.find(name => name === input);
    }, "");

    this.db.useDb(dbName);
  }
}

const i = new Importer([]);
i.run().finally();