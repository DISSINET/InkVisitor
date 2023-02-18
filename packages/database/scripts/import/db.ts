import { r, RConnectionOptions, Connection, Func } from "rethinkdb-ts";
import { getEnv } from "./common";

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

    async connect(): Promise<void> {
        try {
            this.conn = await r.connect(this.dbConfig);
        } catch (e) {
            throw new Error(`Cannot connect to the db: ${e}`);
        }
    }

    async end(): Promise<void> {
        return this.conn?.close();
    }

    async dbDrop(name: string): Promise<void> {
        try {
            await r.dbDrop(name).run(this.conn);
            console.log("Database dropped");
        } catch (e) {
            console.log(`Database not dropped ('${name}'). Does not exist?`);
        }
    }

    async dbCreate(): Promise<void> {
        try {
            await r.dbCreate(this.dbConfig.name).run(this.conn);
            console.log("Database created");
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
        console.log(`Using db ${dbName}`);
        this.dbConfig.name = dbName;
        this.conn?.use(dbName);
    }
}
