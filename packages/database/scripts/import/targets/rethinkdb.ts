import { r, Connection } from "rethinkdb-ts";
import colors from "colors/safe";
import { getEnv, TableSchema } from "../common";
import { InsertResult, SeedTarget } from "../target";
import { TABLES, buildIndex } from "@service/storage/rethink/provision";

export interface IDbConfig {
  name: string;
  host: string;
  port: number;
  password: string;
}

export class RethinkTarget implements SeedTarget {
  readonly kind = "rethinkdb" as const;
  conn?: Connection;
  dbConfig: IDbConfig;

  constructor() {
    this.dbConfig = {
      host: getEnv("DB_HOST"),
      port: parseInt(getEnv("DB_PORT")),
      name: getEnv("DB_NAME"),
      password: getEnv("DB_PASS"),
    };
  }

  get dbName(): string {
    return this.dbConfig.name;
  }

  /** the connection, for the jobs that speak ReQL directly */
  getConnection(): Connection {
    if (!this.conn) {
      throw new Error("Connection not available");
    }
    return this.conn;
  }

  async connect(): Promise<void> {
    try {
      this.conn = await r.connect(this.dbConfig);
    } catch (e) {
      console.error(this.dbConfig);
      throw new Error(`Cannot connect to the db: ${e}`);
    }
    if (this.dbConfig.name) {
      this.useDb(this.dbConfig.name);
    }
    console.log("connected (rethinkdb)");
  }

  async end(): Promise<void> {
    return this.conn?.close();
  }

  async dbDrop(): Promise<void> {
    try {
      await r.dbDrop(this.dbConfig.name).run(this.conn);
      console.log(colors.green(`Database ${this.dbConfig.name} dropped`));
    } catch (e) {
      console.log(
        colors.yellow(`Database not dropped ('${this.dbConfig.name}'). Does is exist?`)
      );
    }
  }

  async dbCreate(): Promise<void> {
    try {
      await r.dbCreate(this.dbConfig.name).run(this.conn);
      console.log(colors.green(`Database ${this.dbConfig.name} created`));
    } catch (e) {
      throw new Error(`Database not created: ${e}`);
    }
  }

  async dbList(): Promise<string[]> {
    try {
      return await r.dbList().run(this.conn);
    } catch (e) {
      throw new Error(`Cannot retieve db list: ${e}`);
    }
  }

  useDb(dbName: string) {
    console.log(colors.blue(`Using db ${dbName}`));
    this.dbConfig.name = dbName;
    this.conn?.use(dbName);
  }

  async createTables(): Promise<void> {
    for (const [name, indexes] of Object.entries(TABLES)) {
      await r.tableCreate(name).run(this.conn);
      for (const index of indexes) {
        await buildIndex(r.table(name), index).run(this.conn);
      }
      if (indexes.length) {
        await r.table(name).indexWait().run(this.conn);
      }
      console.log(colors.green(`Table ${name} created`));
    }
  }

  /**
   * The driver reports a per-row write failure in the result rather than by
   * throwing, so the outcome is read from there. A duplicate id keeps the row
   * already stored, which is the behaviour the seeder wants.
   */
  async insert(
    table: TableSchema,
    rows: Record<string, unknown>[]
  ): Promise<InsertResult> {
    const result = await r.table(table.tableName).insert(rows).run(this.conn);
    const duplicates = (result.first_error ?? "").includes(
      "Duplicate primary key"
    );
    return {
      inserted: result.inserted,
      duplicates: duplicates ? result.errors : 0,
      failed: duplicates ? 0 : result.errors,
    };
  }

  async count(table: TableSchema): Promise<number> {
    return r.table(table.tableName).count().run(this.conn);
  }
}
