import { r, Connection, } from "rethinkdb-ts";
import { getEnv } from "./common";
import colors from "colors/safe";
import { TableSchema } from "scripts/import-utils";

export interface IDbConfig {
    name: string;
    host: string;
    port: number;
    password: string;
}

export
    class DbHelper {
    database: string = "";
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

    /**
     * Connects to the db service according to config values
     * @returns Promise<void>
     */
    async connect(): Promise<void> {
        try {
            this.conn = await r.connect(this.dbConfig);
        } catch (e) {
            throw new Error(`Cannot connect to the db: ${e}`);
        }
    }

    /**
     * Closes the db connection
     * @returns Promise<void>
     */
    async end(): Promise<void> {
        return this.conn?.close();
    }

    /**
     * Drops single database - irreversible process
     * @returns Promise<void>
     */
    async dbDrop(): Promise<void> {
        try {
            await r.dbDrop(this.dbConfig.name).run(this.conn);
            console.log(colors.green(`Database ${this.dbConfig.name} dropped`));
        } catch (e) {
            console.log(colors.yellow(`Database not dropped ('${this.dbConfig.name}'). Does not exist?`));
        }
    }

    /**
     * Creates single database without tables
     * @returns Promise<void>
     */
    async dbCreate(): Promise<void> {
        try {
            await r.dbCreate(this.dbConfig.name).run(this.conn);
            console.log(colors.green(`Database ${this.dbConfig.name} created`));
        } catch (e) {
            throw new Error(`Database not created: ${e}`);
        }
    }

    /**
     * Returns list of existing databases
     * @returns Promise<string[]> list of database names
     */
    async dbList(): Promise<string[]> {
        try {
            return await r.dbList().run(this.conn);
        } catch (e) {
            throw new Error(`Cannot retieve db list: ${e}`);
        }
    }

    /**
     * Sets the active db name which will be used in all actions
     * @param dbName 
     */
    useDb(dbName: string) {
        console.log(colors.blue(`Using db ${dbName}`));
        this.dbConfig.name = dbName;
        this.conn?.use(dbName);
    }

    /**
    * Creates table with indexes
    * @param table TableSchema table collection
    * @returns Promise<void>
    */
    async createTables(table: TableSchema): Promise<void> {
        await r.tableCreate(table.tableName).run(this.conn);
        if (table.indexes) {
            for (const i in table.indexes) {
                await table.indexes[i](r.table(table.tableName)).run(this.conn);
            }
        }

        console.log(colors.green(`Table ${table.tableName} created`));
    }

    /**
     * Imports data for single table
     * @param table TableSchema table collection
     * @returns Promise<void>
     */
    async importData(table: TableSchema): Promise<void> {
        table.transform();

        const step = 200;
        for (let start = 0; start < table.data.length; start += step) {
            const end = Math.min(start + step, table.data.length);
            const progress = end * step / table.data.length / step * 100;
            await r.table(table.tableName).insert(table.data.slice(start, end)).run(this.conn);
            process.stdout.write(`Importing: ${progress.toFixed(2)}%\r`);
        }
        const itemsImported = await r.table(table.tableName).count().run(this.conn);
        console.log(colors.green(`Imported ${itemsImported}/${table.data.length} entries to table ${table.tableName}`));

        return;
    };
}
