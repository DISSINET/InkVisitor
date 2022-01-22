import { Connection, r as rethink } from "rethinkdb-ts";
import { Request, Response } from "express";

export const rethinkConfig = {
  db: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process?.env?.DB_PORT || "28015"),
  password: process.env.DB_AUTH,
};

export class Db {
  // force type
  connection: Connection = {} as Connection;

  constructor() {
    if (!rethinkConfig.db || !rethinkConfig.host || !rethinkConfig.port) {
      throw new Error("Missing db params, check env vars");
    }
  }

  async initDb(): Promise<void> {
    this.connection = await rethink.connect({
      ...rethinkConfig,
      timeout: 2, // important -  close will wait for this seconds
    });
  }

  async close() {
    if (this.connection) {
      await this.connection.close({ noreplyWait: true });
    }
  }
}

/*
 * Send back a 500 error.
 */
export function handleErrorMiddleware(response: Response) {
  return (error: any) => {
    const status = 500;
    const message = error.message;
    response.send({ status, message });
  };
}

/*
 * Open RethinkDB connection and store in `request.rethink`.
 */
export const createConnection = async (request: Request): Promise<void> => {
  request.db = new Db();
  await request.db.initDb();
};

/*
 * Close the RethinkDB connection stored in `request.rethink`.
 */
export const closeConnection = async (request: Request): Promise<void> => {
  if (request.db) {
    await request.db.close();
  }
};
