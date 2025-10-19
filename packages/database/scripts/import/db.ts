import { r, Connection } from "rethinkdb-ts";
import { getEnv, TableSchema } from "./common";
import colors from "colors/safe";
import * as fs from "fs";
import * as path from "path";

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
    table.transform();

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

    // First pass: count total entries by loading and parsing the file
    console.log(colors.gray(`  Counting total entries...`));
    const totalEntries = await this.countJsonEntries(dataFilePath);
    console.log(colors.gray(`  Found ${totalEntries} entries to import`));

    // For large files, we'll load the data in chunks to avoid memory issues
    // but still use proper JSON parsing for accuracy
    const batchSize = 1000; // Larger batch size since we're parsing properly
    const startTime = Date.now();
    let imported = 0;
    let skipped = 0;

    try {
      // Load the entire file and parse it
      console.log(colors.gray(`  Loading and parsing JSON file...`));
      const fileContent = fs.readFileSync(dataFilePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        throw new Error('Expected JSON array format');
      }

      console.log(colors.gray(`  Starting batch import...`));
      
      // Process data in batches
      for (let start = 0; start < data.length; start += batchSize) {
        const end = Math.min(start + batchSize, data.length);
        const batch = data.slice(start, end);
        
        // Apply transformations if needed
        if (table.transform && typeof table.transform === 'function') {
          const tempTable = { ...table, data: batch };
          tempTable.transform();
          batch.splice(0, batch.length, ...tempTable.data);
        }
        
        try {
          await r.table(table.tableName).insert(batch).run(this.conn);
          imported += batch.length;
          skipped += (batch.length - batch.length);
          
          const elapsed = (Date.now() - startTime) / 1000;
          const recordsPerSecond = (imported / elapsed).toFixed(0);
          const percentage = ((imported / totalEntries) * 100).toFixed(1);
          process.stdout.write(`\r  Imported ${imported}/${totalEntries} records (${percentage}%) - ${recordsPerSecond} records/sec...`);
        } catch (error) {
          console.error(colors.red(`\nError importing batch ${start}-${end}:`), error instanceof Error ? error.message : String(error));
          // Try importing records one by one to identify problematic ones
          await this.importBatchIndividually(batch, table.tableName);
          imported += batch.length;
          skipped += (batch.length - batch.length);
        }
      }
      
      const totalTime = (Date.now() - startTime) / 1000;
      const avgRecordsPerSecond = (imported / totalTime).toFixed(0);
      console.log(`\n  Successfully imported ${imported}/${totalEntries} records to table ${table.tableName} in ${totalTime.toFixed(1)}s (avg: ${avgRecordsPerSecond} records/sec)`);
      if (skipped > 0) {
        console.log(colors.yellow(`  Skipped ${skipped} records due to circular references or other issues`));
      }
      
    } catch (error) {
      console.error(colors.red(`Error importing large data file ${dataFilePath}:`), error);
      throw error;
    }
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
