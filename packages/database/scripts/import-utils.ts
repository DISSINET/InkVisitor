import {
  Connection,
  RConnectionOptions,
  r,
  RValue,
  RTable,
} from "rethinkdb-ts";

export interface DbSchema {
  users: TableSchema;
  aclPermissions: TableSchema;
  entities: TableSchema;
  audits: TableSchema;
  relations: TableSchema;
}

export interface TableSchema {
  tableName: RValue<string>;
  data: any;
  transform: () => void;
  indexes?: ((table: RTable) => any)[];
}

export function parseArgs(): [datasetId: string, env: string] {
  const datasetId: string = process.argv[2];
  const env = process.argv[3];

  return [datasetId, env];
}

export const prepareDbConnection = async (
  config: RConnectionOptions
): Promise<Connection> => {
  let conn: Connection;

  try {
    conn = await r.connect(config);
  } catch (e) {
    throw new Error(`Cannot connect to the db: ${e}`);
  }

  // Drop the database.
  try {
    await r.dbDrop(config.db as RValue<string>).run(conn);
    console.log("Database dropped");
  } catch (e) {
    console.log(`Database not dropped ('${config.db}'). Does not exist?`);
  }

  try {
    await r.dbCreate(config.db as RValue<string>).run(conn);
    console.log("Database created");
  } catch (e) {
    throw new Error(`Database not created: ${e}`);
  }

  // set default database
  conn.use(config.db as string);

  return conn;
};
