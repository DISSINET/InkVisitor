import { IUser } from "../../shared/types/user";
import { hashPassword } from "../../server/src/common/auth";
import { IAudit, IEntity } from "../../shared/types";
import { Relation } from "../../shared/types/relation";
import { confirm } from "./import/prompts";
import { DbSchema, checkRelation, TableSchema } from "./import/common";
import {
  auditsIndexes,
  entitiesIndexes,
  relationsIndexes,
} from "./import/indexes";
import { EntityEnums } from "@shared/enums";
import { question } from "./import/prompts";
import { DbHelper } from "./import/db";
import { getEnv } from "./import/common";
import { SshHelper } from "./import/ssh";
import colors from "colors/safe";
import jobs from "./jobs/index";

const datasets: Record<string, DbSchema> = {
  dissinet_documents: {
    users: {
      tableName: "users",
      data: null,
      transform: function () {}
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: null,
      transform: function () {}
    },
    entities: {
      tableName: "entities",
      data: null,
      transform: function () {}
    },
    audits: {
      tableName: "audits",
      data: null,
      transform: function () {}
    },
    relations: {
      tableName: "relations",
      data: null,
      transform: function () {}
    },
    documents: {
      tableName: "documents",
      data: require("../datasets/dissinet-documents/documents.json"),
      transform: function () {},
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
      transform: function () {},
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/empty/entities.json"),
      transform: function () {
        this.data = this.data.map((entity: IEntity) => {
          if (!entity.createdAt) {
            entity.createdAt = new Date();
          }
          return entity;
        });
      },
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
      transform: function () {},
      indexes: relationsIndexes,
    },
    documents: {
      tableName: "documents",
      data: require("../datasets/default/documents.json"),
      transform: function () {},
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
      transform: function () {},
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/relationstest/entities.json"),
      transform: function () {
        this.data = this.data.map((entity: IEntity) => {
          if (!entity.createdAt) {
            entity.createdAt = new Date();
          }
          return entity;
        });
      },
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
    documents: {
      tableName: "documents",
      data: require("../datasets/default/documents.json"),
      transform: function () {},
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
      transform: function () {},
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/all-parsed/entities.json"),
      transform: function () {
        this.data = this.data.map((entity: IEntity) => {
          if (!entity.createdAt) {
            entity.createdAt = new Date();
          }

          // fix missing entity pos
          if (entity.class === EntityEnums.Class.Concept) {
            if (!entity.data.pos) {
              entity.data.pos = EntityEnums.ConceptPartOfSpeech.Empty;
            }
          }
          if (entity.class === EntityEnums.Class.Action) {
            if (!entity.data.pos) {
              entity.data.pos = EntityEnums.ActionPartOfSpeech.Verb;
            }
          }

          return entity;
        });
      },
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
    documents: {
      tableName: "documents",
      data: require("../datasets/default/documents.json"),
      transform: function () {},
    },
  },
  initial_c: {
    users: {
      tableName: "users",
      data: null,
      transform: function () {},
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: null,
      transform: function () {},
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/initial-c/entities.json"),
      transform: function () {},
      indexes: entitiesIndexes,
    },
    audits: {
      tableName: "audits",
      data: null,
      transform: function () {},
      indexes: auditsIndexes,
    },
    relations: {
      tableName: "relations",
      data: null,
      transform: function () {},
      indexes: relationsIndexes,
    },
    documents: {
      tableName: "documents",
      data: null,
      transform: function () {},
    },
  },
  initial_a: {
    users: {
      tableName: "users",
      data: null,
      transform: function () {},
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: null,
      transform: function () {},
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/initial-a/entities.json"),
      transform: function () {},
      indexes: entitiesIndexes,
    },
    audits: {
      tableName: "audits",
      data: null,
      transform: function () {},
      indexes: auditsIndexes,
    },
    relations: {
      tableName: "relations",
      data: null,
      transform: function () {},
      indexes: relationsIndexes,
    },
    documents: {
      tableName: "documents",
      data: null,
      transform: function () {},
    },
  },
  acr: {
    users: {
      tableName: "users",
      data: null,
      transform: function () {},
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: null,
      transform: function () {},
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/acr/entities.json"),
      transform: function () {},
      indexes: entitiesIndexes,
    },
    audits: {
      tableName: "audits",
      data: null,
      transform: function () {},
      indexes: auditsIndexes,
    },
    relations: {
      tableName: "relations",
      data: require("../datasets/acr/relations.json"),
      transform: function () {},
      indexes: relationsIndexes,
    },
    documents: {
      tableName: "documents",
      data: null,
      transform: function () {},
    },
  },
  production: {
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
      transform: function () {},
    },
    entities: {
      tableName: "entities",
      data: require("../datasets/production/entities.json"),
      transform: function () {},
      indexes: entitiesIndexes,
    },
    audits: {
      tableName: "audits",
      data: require("../datasets/empty/audits.json"),
      transform: function () {},
      indexes: auditsIndexes,
    },
    relations: {
      tableName: "relations",
      data: require("../datasets/production/relations.json"),
      transform: function () {},
      indexes: relationsIndexes,
    },
    documents: {
      tableName: "documents",
      data: require("../datasets/production/documents.json"),
      transform: function () {},
    },
  },
};

enum MODES {
  NOTHING = 0,
  USE_SSH = 1 << 0,
  RECREATE_DATABASE = 1 << 1,
  IMPORT_DATA = 1 << 2,
}

class Importer {
  mode: MODES = MODES.NOTHING;

  db: DbHelper;
  ssh?: SshHelper;
  datasetName?: string;
  dataset?: DbSchema;

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
    if (
      this.modeEnabled(MODES.USE_SSH) ||
      (await confirm("Use SSH connection?"))
    ) {
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

    if (process.argv.length > 2 && process.argv[2]) {
      this.db.useDb(process.argv[2]);
    }

    do {
      const lastAction = await this.selectAction();
      if (lastAction) {
        break;
      }
    } while (1);

    await this.end();
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
  async selectAction(): Promise<boolean> {
    let that = this;
    const menu: Record<
      string,
      { description: string; action: Function; lastAction?: boolean }
    > = {
      L: {
        description: `Enter '${colors.yellow("L")}' to switch databases`,
        action: that.selectDb.bind(that),
      },
      D: {
        description: `Enter '${colors.yellow("D")}' to select dataset`,
        action: that.selectDataset.bind(that),
      },
      E: {
        description: `Enter '${colors.yellow("E")}' to end`,
        action: () => {},
        lastAction: true,
      },
      X: {
        description: `Enter '${colors.yellow(
          "X"
        )}' to do a drop, recreate & import`,
        action: that.dropAndImport.bind(that),
        lastAction: true,
      },
      C: {
        description: `Enter '${colors.yellow(
          "C"
        )}' to drop and recreate without the data`,
        action: that.dropAndCreate.bind(that),
        lastAction: true,
      },
      T: {
        description: `Enter '${colors.yellow(
          "T"
        )}' to recreate & import data for single table`,
        action: that.createSingleTable.bind(that),
        lastAction: true,
      },
      J: {
        description: `Enter '${colors.yellow("J")}' to select jobs`,
        action: that.selectJob.bind(that),
        lastAction: true,
      },
    };

    if (!this.datasetName || !this.db.dbConfig.name) {
      delete menu["X"];
      delete menu["C"];
      delete menu["T"];
    }

    if (!this.db.dbConfig.name) {
      delete menu["J"];
    }

    const info: string[] = [];
    info.push(`ssh=${!!this.ssh ? colors.green("true") : colors.red("false")}`);
    if (this.datasetName) {
      info.push(
        `dataset=${
          this.datasetName
            ? colors.green(this.datasetName)
            : colors.red("not set")
        }`
      );
    }
    if (this.db.dbConfig.name) {
      info.push(
        `db=${
          this.db.dbConfig.name
            ? colors.green(this.db.dbConfig.name)
            : colors.red("not set")
        }`
      );
    }

    console.log(`\nImport app${info.length ? ": " + info.join(", ") : ""}`);
    console.log(
      `To specify db from the command line, use ${colors.yellow(
        "npm start <dbname>"
      )}\n`
    );
    Object.values(menu).forEach((item) => console.log(item.description));

    const actionChoice = await question<string>(
      "",
      (input: string): string | undefined => {
        return Object.keys(menu).find(
          (key) => key.toLowerCase() === input.toLowerCase()
        );
      },
      ""
    );
    try {
      await menu[actionChoice].action();
      return !!menu[actionChoice].lastAction;
    } catch (e) {
      console.log(colors.red(`Something went wrong: ${e}`));
      return false;
    }
  }

  /**
   * Action which asks which db should be used in the following session
   * @returns Promise<void>
   */
  async selectDb(): Promise<void> {
    const dbNames = await this.db.dbList();
    console.log(
      `Databases: ${[
        "",
        ...dbNames.map((name, i) => `${name} (${i + 1})}`),
      ].join("\n- ")}`
    );

    const dbName = await question<string>(
      "Choose the db (name/number)",
      (input: string): string | undefined => {
        if (parseInt(input) > 0) {
          input = dbNames[parseInt(input) - 1];
        }

        return dbNames.find((name) => name === input);
      },
      ""
    );

    this.db.useDb(dbName);
  }

  /**
   * Action which asks which collection should be used in the following session
   * @returns Promise<void>
   */
  async selectDataset(): Promise<void> {
    console.log(
      `Datasets: ${[
        "",
        ...Object.keys(datasets).map((key, i) => `${key} (${i + 1})`),
      ].join("\n- ")}`
    );

    const dataset = await question<string>(
      "Choose the dataset (name/number)",
      (input: string): string | undefined => {
        if (parseInt(input) > 0) {
          input = Object.keys(datasets)[parseInt(input) - 1];
        }

        return Object.keys(datasets).find((key) => key === input);
      },
      ""
    );

    this.dataset = datasets[dataset];
    this.datasetName = dataset;
  }

  async selectJob(): Promise<void> {
    console.log(
      `Jobs: ${[
        "",
        ...Object.keys(jobs).map((key, i) => {
          let jobName = key.replace(/([A-Z])/g, " $1");
          jobName = jobName.charAt(0).toUpperCase() + jobName.slice(1);
          return `${jobName} (${i + 1})`;
        }),
      ].join("\n- ")}`
    );

    const job = await question<string>(
      "Choose the job (name/number)",
      (input: string): string | undefined => {
        if (parseInt(input) > 0) {
          input = Object.keys(jobs)[parseInt(input) - 1];
        }

        return Object.keys(jobs).find((key) => key === input);
      },
      ""
    );

    await jobs[job](this.db.getConnection());
  }

  /**
   * Action drops and imports the database without any further prompt
   * @returns Promise<void>
   */
  async dropAndImport(): Promise<void> {
    if (!this.dataset || !this.db.dbConfig.name) {
      console.log(colors.red("Dataset / database name not set"));
      return;
    }

    await this.db.dbDrop();
    await this.db.dbCreate();
    for (const tableConfig of Object.values(this.dataset)) {
      await this.db.createTable(tableConfig);
    }
    for (const tableConfig of Object.values(this.dataset)) {
      await this.db.importData(tableConfig);
    }
  }

  /**
   * Action drops and creates the database without data
   * @returns Promise<void>
   */
  async dropAndCreate(): Promise<void> {
    if (!this.dataset || !this.db.dbConfig.name) {
      console.log(colors.red("Dataset / database name not set"));
      return;
    }

    await this.db.dbDrop();
    await this.db.dbCreate();
    for (const tableConfig of Object.values(this.dataset)) {
      await this.db.createTable(tableConfig);
    }
  }

  /**
   * Action recreates + import data for single table
   * @returns Promise<void>
   */
  async createSingleTable(): Promise<void> {
    if (!this.dataset || !this.db.dbConfig.name) {
      console.log(colors.red("Dataset / database name not set"));
      return;
    }

    const tableList = Object.keys(this.dataset);
    console.log(
      `Tables: ${["", ...tableList.map((key, i) => `${key} (${i + 1})`)].join(
        "\n- "
      )}`
    );
    const chosenTable = await question<string>(
      "Choose the table (name/number)",
      (input: string): string | undefined => {
        if (parseInt(input) > 0) {
          input = tableList[parseInt(input) - 1];
        }

        return tableList.find((key) => key === input);
      },
      ""
    );

   // await this.db.dropTable(chosenTable);
   // await this.db.createTable(this.dataset[chosenTable as keyof DbSchema]);
    await this.db.importData(this.dataset[chosenTable as keyof DbSchema]);
  }
}

const i = new Importer([]);
i.run().finally();
