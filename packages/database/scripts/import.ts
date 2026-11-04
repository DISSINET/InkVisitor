import { confirm, question } from "./import/prompts";
import { DbSchema, flag, getEnv, getEnvOptional, positionals } from "./import/common";
import {
  dataFilePath,
  datasets,
  findRawDatasets,
  prepareRawDataset,
} from "./import/datasets";
import { feedTable } from "./import/feed";
import { SeedTarget } from "./import/target";
import { createTargets } from "./import/targets";
import { RethinkTarget } from "./import/targets/rethinkdb";
import { SshHelper } from "./import/ssh";
import colors from "colors/safe";
import jobs from "./jobs/index";

enum MODES {
  NOTHING = 0,
  USE_SSH = 1 << 0,
  RECREATE_DATABASE = 1 << 1,
  IMPORT_DATA = 1 << 2,
}

class Importer {
  mode: MODES = MODES.NOTHING;

  targets: SeedTarget[];
  ssh?: SshHelper;
  datasetName?: string;
  dataset?: DbSchema;

  constructor(initialModes: MODES[]) {
    for (const mode of initialModes) {
      this.mode = this.mode | mode;
    }
    this.targets = createTargets(flag("target") ?? getEnvOptional("DB_TARGET") ?? "rethinkdb");
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

  /** the RethinkDB target; jobs and the ssh tunnel only exist for it */
  private get rethink(): RethinkTarget | undefined {
    return this.targets.find((t): t is RethinkTarget => t.kind === "rethinkdb");
  }

  /** the selected database; run() points every target at this one name */
  private get dbName(): string {
    return this.targets[0].dbName;
  }

  private useDb(name: string) {
    for (const target of this.targets) {
      target.useDb(name);
    }
  }

  /**
   * Starts the lifecycle by initiating the optional ssh connection and mandatory db connection.
   * Then starts polling for user input and doing actions afterwards.
   */
  async run(): Promise<void> {
    const rethink = this.rethink;
    if (
      rethink &&
      (this.modeEnabled(MODES.USE_SSH) || (await confirm("Use SSH connection?")))
    ) {
      this.ssh = new SshHelper({
        sshIp: getEnv("SSH_IP"),
        sshPassword: getEnv("SSH_PASSWORD"),
        sshUsername: getEnv("SSH_USERNAME"),
        dstPort: rethink.dbConfig.port,
        localPort: rethink.dbConfig.port,
      });
      await this.ssh.startSshTunnel();
    }

    for (const target of this.targets) {
      await target.connect();
    }

    // each target defaults to its own env name, so the first one's wins and
    // every target holds the database the menu shows
    const [dbName] = positionals();
    this.useDb(dbName ?? this.targets[0].dbName);

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
    for (const target of this.targets) {
      await target.end();
    }
  }

  /**
   * Shows the main menu and waits for user input
   * @returns Promise<void>
   */
  async selectAction(): Promise<boolean> {
    let that = this;
    const menu: Record<
      string,
      { description: string; action: () => unknown; lastAction?: boolean }
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

    if (!this.datasetName || !this.dbName) {
      delete menu["X"];
      delete menu["C"];
      delete menu["T"];
    }

    if (!this.dbName || !this.rethink) {
      delete menu["J"];
    }

    const info: string[] = [];
    info.push(`target=${colors.green(this.targets.map((t) => t.kind).join("+"))}`);
    info.push(`ssh=${!!this.ssh ? colors.green("true") : colors.red("false")}`);
    if (this.datasetName) {
      info.push(`dataset=${colors.green(this.datasetName)}`);
    }
    if (this.dbName) {
      info.push(`db=${colors.green(this.dbName)}`);
    }

    console.log(`\nImport app${info.length ? ": " + info.join(", ") : ""}`);
    console.log(
      `To specify db from the command line, use ${colors.yellow(
        "npm start <dbname> [--target=rethinkdb|postgres|both]"
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
    const dbNames = await this.targets[0].dbList();
    console.log(
      `Databases: ${[
        "",
        ...dbNames.map((name, i) => `${name} (${i + 1})`),
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

    this.useDb(dbName);
  }

  /**
   * Action which asks which collection should be used in the following session
   * @returns Promise<void>
   */
  async selectDataset(): Promise<void> {
    const regularDatasets = Object.keys(datasets);
    const rawDatasets = findRawDatasets();

    const allDatasetOptions: Array<{ name: string; isRaw: boolean; index: number }> = [];

    regularDatasets.forEach((key, i) => {
      allDatasetOptions.push({ name: key, isRaw: false, index: i + 1 });
    });

    rawDatasets.forEach((key, i) => {
      allDatasetOptions.push({ name: key, isRaw: true, index: regularDatasets.length + i + 1 });
    });

    console.log(
      `Datasets: ${[
        "",
        ...allDatasetOptions.map((opt) =>
          `${opt.name}${opt.isRaw ? " (raw)" : ""} (${opt.index})`
        ),
      ].join("\n- ")}`
    );

    const dataset = await question<string>(
      "Choose the dataset (name/number)",
      (input: string): string | undefined => {
        const num = parseInt(input);
        if (num > 0 && num <= allDatasetOptions.length) {
          const selected = allDatasetOptions[num - 1];
          return selected.name;
        }

        const found = allDatasetOptions.find((opt) => opt.name === input);
        return found ? found.name : undefined;
      },
      ""
    );

    const selectedOption = allDatasetOptions.find((opt) => opt.name === dataset);
    this.datasetName = dataset;
    this.dataset = selectedOption?.isRaw
      ? await prepareRawDataset(dataset)
      : datasets[dataset];
  }

  async selectJob(): Promise<void> {
    const rethink = this.rethink;
    if (!rethink) {
      console.log(colors.red("Jobs run against RethinkDB only"));
      return;
    }
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

    await jobs[job](rethink.getConnection());
  }

  /** drops and recreates the selected database with every table and index, on every target */
  private async recreate(): Promise<void> {
    for (const target of this.targets) {
      await target.dbDrop();
      await target.dbCreate();
      await target.createTables();
    }
  }

  /**
   * Action drops and imports the database without any further prompt
   * @returns Promise<void>
   */
  async dropAndImport(): Promise<void> {
    if (!this.dataset || !this.datasetName || !this.dbName) {
      console.log(colors.red("Dataset / database name not set"));
      return;
    }

    await this.recreate();
    for (const table of Object.values(this.dataset)) {
      await feedTable(this.targets, table, dataFilePath(this.datasetName, table));
    }
    for (const target of this.targets) {
      await target.addConstraints();
    }
  }

  /**
   * Action drops and creates the database without data
   * @returns Promise<void>
   */
  async dropAndCreate(): Promise<void> {
    if (!this.dataset || !this.dbName) {
      console.log(colors.red("Dataset / database name not set"));
      return;
    }

    await this.recreate();
    for (const target of this.targets) {
      await target.addConstraints();
    }
  }

  /**
   * Action recreates + import data for single table
   * @returns Promise<void>
   */
  async createSingleTable(): Promise<void> {
    if (!this.dataset || !this.datasetName || !this.dbName) {
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

    const tableConfig = this.dataset[chosenTable as keyof DbSchema];
    await feedTable(this.targets, tableConfig, dataFilePath(this.datasetName, tableConfig));
  }
}

const i = new Importer([]);
i.run().finally();
