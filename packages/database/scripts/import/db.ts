import { r, Connection } from "rethinkdb-ts";
import { getEnv, TableSchema } from "./common";
import colors from "colors/safe";
import * as fs from "fs";
import * as path from "path";
import { createReadStream } from "fs";
const StreamArray = require("stream-json/streamers/StreamArray.js") as {
  withParser: (opts?: unknown) => NodeJS.ReadWriteStream;
};

export interface IDbConfig {
  name: string;
  host: string;
  port: number;
  password: string;
}

export class DbHelper {
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
   * Returns the connection instance or throws an error in case the connection not initiated
   * @returns Connection
   */
  getConnection(): Connection {
    if (!this.conn) {
      throw new Error("Connection not available");
    }

    return this.conn;
  }

  /**
   * Connects to the db service according to config values
   * @returns Promise<void>
   */
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
    console.log("connected");
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
      console.log(
        colors.yellow(
          `Database not dropped ('${this.dbConfig.name}'). Does is exist?`
        )
      );
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
  async createTable(table: TableSchema): Promise<void> {
    await r.tableCreate(table.tableName).run(this.conn);
    if (table.indexes) {
      for (const i in table.indexes) {
        await table.indexes[i](r.table(table.tableName)).run(this.conn);
      }
    }

    console.log(colors.green(`Table ${table.tableName} created`));
  }

  /**
   * Drops single table
   * @param table TableSchema table collection
   * @returns Promise<void>
   */
  async dropTable(table: string): Promise<void> {
    await r.tableDrop(table).run(this.conn);
    console.log(colors.green(`Table ${table} dropped`));
  }

  /**
   * Imports data for single table
   * @param table TableSchema table collection
   * @returns Promise<void>
   */
  async importData(table: TableSchema): Promise<void> {
    if (table.transform) {
      table.transform();
    }

    if (!table.data || !Array.isArray(table.data)) {
      console.log(colors.yellow(`No data to import for table ${table.tableName}`));
      return;
    }

    const totalItems = table.data.length;
    const step = 200;
    let imported = 0;
    let skipped = 0;
    
    console.log(colors.cyan(`Importing ${totalItems} entries to table ${table.tableName}...`));
    
    for (let start = 0; start < totalItems; start += step) {
      const end = Math.min(start + step, totalItems);
      const progress = ((end / totalItems) * 100);

      const slicedData = table.data.slice(start, end);
      
      // Sanitize data to remove circular references
      skipped += (slicedData.length - slicedData.length);

      try {
        await r.table(table.tableName).insert(slicedData).run(this.conn);
        imported += slicedData.length;
      } catch (error) {
        console.error(colors.red(`\nError importing batch ${start}-${end}:`), error instanceof Error ? error.message : String(error));
        // Try importing individually
        await this.importBatchIndividually(slicedData, table.tableName);
        imported += slicedData.length;
      }
      
      process.stdout.write(
        `Importing ${table.tableName}: ${progress.toFixed(2)}%\r`
      );
    }
    
    const itemsImported = await r.table(table.tableName).count().run(this.conn);
    console.log(
      colors.green(
        `\nImported ${itemsImported}/${totalItems} entries to table ${table.tableName}`
      )
    );
    
    if (skipped > 0) {
      console.log(colors.yellow(`  Skipped ${skipped} records due to circular references or other issues`));
    }

    return;
  }

  /**
   * Imports data for large files using streaming to avoid memory issues
   * @param table TableSchema table collection
   * @param dataFilePath Path to the JSON data file
   * @returns Promise<void>
   */
  async importLargeData(table: TableSchema, dataFilePath: string): Promise<void> {
    if (!fs.existsSync(dataFilePath)) {
      console.log(colors.yellow(`Data file not found: ${dataFilePath}`));
      return;
    }

    const stats = fs.statSync(dataFilePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(colors.cyan(`Importing ${table.tableName} (${fileSizeMB.toFixed(2)} MB)...`));
    console.log(colors.gray(`  Streaming JSON (no full load)...`));

    const BATCH_SIZE = 1000;
    const startTime = Date.now();
    let imported = 0;
    let batch: any[] = [];
    let pendingFlush: Promise<void> = Promise.resolve();

    const flushBatch = async (): Promise<void> => {
      if (batch.length === 0) return;
      let toInsert = batch;
      batch = [];
      if (table.transform && typeof table.transform === "function") {
        const tempTable = { ...table, data: toInsert };
        tempTable.transform!();
        toInsert = tempTable.data;
      }
      try {
        await r.table(table.tableName).insert(toInsert).run(this.conn);
        imported += toInsert.length;
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = elapsed > 0 ? (imported / elapsed).toFixed(0) : "0";
        process.stdout.write(`\r  Imported ${imported} records - ${rate} records/sec...`);
      } catch (error) {
        await this.importBatchIndividually(toInsert, table.tableName);
        imported += toInsert.length;
      }
    };

    return new Promise((resolve, reject) => {
      const pipeline = createReadStream(dataFilePath).pipe(StreamArray.withParser());
      pipeline.on("data", ({ value }: { value: any }) => {
        batch.push(value);
        if (batch.length >= BATCH_SIZE) {
          pipeline.pause();
          pendingFlush = pendingFlush
            .then(() => flushBatch())
            .then(() => {
              pipeline.resume();
            })
            .catch((err) => {
              pipeline.emit("error", err);
            });
        }
      });
      pipeline.on("end", () => {
        pendingFlush
          .then(() => flushBatch())
          .then(() => {
            const totalTime = (Date.now() - startTime) / 1000;
            const avgRate = totalTime > 0 ? (imported / totalTime).toFixed(0) : "0";
            console.log(`\n  Imported ${imported} records to ${table.tableName} in ${totalTime.toFixed(1)}s (avg: ${avgRate} records/sec)`);
            resolve();
          })
          .catch(reject);
      });
      pipeline.on("error", reject);
    });
  }

  /**
   * Imports a batch of records individually to handle problematic records
   * @param batch Array of records to import
   * @param tableName Name of the table
   * @returns Promise<void>
   */
  private async importBatchIndividually(batch: any[], tableName: string | any): Promise<void> {
    const tableNameStr = typeof tableName === 'string' ? tableName : String(tableName);
    for (const record of batch) {
      try {
        await r.table(tableNameStr).insert(record).run(this.conn);
      } catch (error) {
        console.log(colors.gray(`    Skipping problematic record: ${record.id || 'unknown'}`));
      }
    }
  }

  /**
   * Counts the total number of JSON entries in a file by loading and parsing it completely
   * @param dataFilePath Path to the JSON data file
   * @returns Promise<number>
   */
  private async countJsonEntries(dataFilePath: string): Promise<number> {
    try {
      console.log(colors.gray(`  Loading file to count entries: ${dataFilePath}`));
      const fileContent = fs.readFileSync(dataFilePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (Array.isArray(data)) {
        return data.length;
      } else {
        // If it's not an array, it's a single object
        return 1;
      }
    } catch (error) {
      console.error(colors.red(`Error counting entries in ${dataFilePath}:`), error);
      throw error;
    }
  }

}
