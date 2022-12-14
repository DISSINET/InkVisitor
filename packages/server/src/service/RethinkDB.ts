import { Connection, r as rethink } from "rethinkdb-ts";
import { Response } from "express";
import { Mutex, Awaiter } from "./mutex"
import { IRequest } from "src/custom_typings/request";

export const rethinkConfig = {
  db: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process?.env?.DB_PORT || "28015"),
  password: process.env.DB_AUTH,
};

export class Db {
  // context for locks
  static mutex = new Mutex();

  // assigned lock for db connection
  lockInstance?: Awaiter;

  // wrapped db sonnection
  connection: Connection = {} as Connection;


  constructor() {
    if (!rethinkConfig.db || !rethinkConfig.host || !rethinkConfig.port) {
      throw new Error("Missing db params, check env vars");
    }
  }

  /**
   * Creates the db connection
   */
  async initDb(): Promise<void> {
    this.connection = await rethink.connect({
      ...rethinkConfig,
      timeout: 2, // important -  close will wait for this seconds
    });
  }

  /**
   * Creates awaiter instance and uses it to lock the mutex - if the queue allows it to
   */
  async lock(): Promise<void> {
    this.lockInstance = new Awaiter();
    await Db.mutex.lock(this.lockInstance)
  }

  /**
   * Clears the mutex lock and closes the db connection
   */
  async close() {
    if (this.lockInstance) {
      Db.mutex.unlock(this.lockInstance);
    }

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
export const createConnection = async (request: IRequest): Promise<void> => {
  request.db = new Db();
  await request.db.initDb();
};

/*
 * Close the RethinkDB connection stored in `request.rethink`.
 */
export const closeConnection = async (request: IRequest): Promise<void> => {
  if (request.db) {
    await request.db.close();
  }
};
