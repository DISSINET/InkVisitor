import { Client } from "pg";
import colors from "colors/safe";
import { getEnv, TableSchema } from "../common";
import { InsertResult, SeedTarget } from "../target";
import { addConstraints, provision } from "@service/storage/postgres/provision";

/** a quoted SQL identifier */
export const ident = (name: string): string => `"${name.replace(/"/g, '""')}"`;

/**
 * A pg Client is bound to one database, so the target keeps two: `admin` on
 * the maintenance database `postgres` for create/drop, and `db` on the
 * selected database, opened on first use and dropped when the name changes.
 */
export class PostgresTarget implements SeedTarget {
  readonly kind = "postgres" as const;
  dbName: string;
  private admin?: Client;
  private db?: Client;
  private readonly config: {
    host: string;
    port: number;
    user: string;
    password: string;
  };

  constructor() {
    this.config = {
      host: getEnv("PG_HOST"),
      port: parseInt(getEnv("PG_PORT")),
      user: getEnv("PG_USER"),
      password: getEnv("PG_PASS"),
    };
    this.dbName = getEnv("PG_NAME");
  }

  private async open(database: string): Promise<Client> {
    const client = new Client({ ...this.config, database });
    await client.connect();
    return client;
  }

  /** a connection to the selected database */
  async client(): Promise<Client> {
    if (!this.db) {
      this.db = await this.open(this.dbName);
    }
    return this.db;
  }

  async connect(): Promise<void> {
    try {
      this.admin = await this.open("postgres");
    } catch (e) {
      console.error({ ...this.config, password: "***" });
      throw new Error(`Cannot connect to postgres: ${e}`);
    }
    console.log("connected (postgres)");
  }

  async end(): Promise<void> {
    await this.db?.end();
    await this.admin?.end();
    this.db = undefined;
    this.admin = undefined;
  }

  async dbList(): Promise<string[]> {
    const { rows } = await this.admin!.query(
      "SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY datname"
    );
    return rows.map((row: { datname: string }) => row.datname);
  }

  useDb(name: string): void {
    console.log(colors.blue(`Using db ${name} (postgres)`));
    this.dbName = name;
    const stale = this.db;
    this.db = undefined;
    stale?.end().catch(() => undefined);
  }

  async dbDrop(): Promise<void> {
    await this.db?.end();
    this.db = undefined;
    await this.admin!.query(
      `DROP DATABASE IF EXISTS ${ident(this.dbName)} WITH (FORCE)`
    );
    console.log(colors.green(`Database ${this.dbName} dropped (postgres)`));
  }

  /** how many clients are connected to the database `name` */
  async connections(name: string): Promise<number> {
    const { rows } = await this.admin!.query(
      "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = $1 AND backend_type = 'client backend'",
      [name]
    );
    return rows[0].n;
  }

  /**
   * Gives the selected database the name `to`. A database already holding that
   * name is renamed to `aside` in the same transaction, so `to` never names a
   * missing or half-loaded database. PostgreSQL renames a database only while
   * nothing is connected to it; a connection would follow the database to its
   * new name.
   */
  async dbPromote(to: string, aside?: string): Promise<void> {
    await this.db?.end();
    this.db = undefined;
    const admin = this.admin!;
    await admin.query("BEGIN");
    try {
      if (aside) {
        await admin.query(`ALTER DATABASE ${ident(to)} RENAME TO ${ident(aside)}`);
      }
      await admin.query(`ALTER DATABASE ${ident(this.dbName)} RENAME TO ${ident(to)}`);
      await admin.query("COMMIT");
    } catch (e) {
      await admin.query("ROLLBACK");
      throw e;
    }
    console.log(colors.green(`Database ${this.dbName} renamed to ${to} (postgres)`));
    this.dbName = to;
  }

  /** code-point ordering like RethinkDB, Unicode-aware lower/upper */
  async dbCreate(): Promise<void> {
    await this.admin!.query(
      `CREATE DATABASE ${ident(this.dbName)} TEMPLATE template0 ENCODING 'UTF8' LOCALE_PROVIDER builtin BUILTIN_LOCALE 'C.UTF-8'`
    );
    console.log(colors.green(`Database ${this.dbName} created (postgres)`));
  }

  async createTables(): Promise<void> {
    await provision(await this.client(), false);
    console.log(colors.green(`Tables and indexes created (postgres)`));
  }

  /**
   * Added after the load rather than deferred in one transaction: feed.ts
   * retries a refused batch row by row, which needs every batch committed on
   * its own.
   */
  async addConstraints(): Promise<void> {
    await addConstraints(await this.client());
    console.log(colors.green(`Constraints added (postgres)`));
  }

  /**
   * One statement per batch; `id` is generated from the document, so a
   * duplicate is skipped and shows up as the difference between the rows sent
   * and the rows the statement reports inserting. Anything the database
   * refuses aborts the statement and throws.
   */
  async insert(
    table: TableSchema,
    rows: Record<string, unknown>[]
  ): Promise<InsertResult> {
    const result = await (await this.client()).query(
      `INSERT INTO ${ident(
        table.tableName
      )} (doc) SELECT jsonb_array_elements($1::jsonb) ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(rows)]
    );
    const inserted = result.rowCount ?? 0;
    return { inserted, duplicates: rows.length - inserted, failed: 0 };
  }

  async count(table: TableSchema): Promise<number> {
    const { rows } = await (await this.client()).query(
      `SELECT count(*)::int AS n FROM ${ident(table.tableName)}`
    );
    return rows[0].n;
  }
}
