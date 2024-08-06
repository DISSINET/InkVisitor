import { Connection, r as rethink } from "rethinkdb-ts";
import { Response } from "express";
import { Mutex, Awaiter } from "./mutex";

export const rethinkConfig = {
  db: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process?.env?.DB_PORT || "28015"),
  password: process.env.DB_AUTH,
  max: parseInt(process.env.DB_POOL_CONNECTIONS || "0") || 0,
};

export class Db {
  // context for locks
  static mutex = new Mutex();

  // assigned lock for db connection
  lockAwaiter?: Awaiter;

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
      timeout: 30, // important -  close will wait for this seconds
    });
  }

  /**
   * Creates awaiter instance and uses it to lock the mutex - if the queue allows it to
   */
  async lock(): Promise<void> {
    this.lockAwaiter = new Awaiter();
    await Db.mutex.lock(this.lockAwaiter);
  }

  /**
   * Clears the mutex lock and closes the db connection
   */
  async close() {
    if (this.lockAwaiter) {
      Db.mutex.unlock(this.lockAwaiter);
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
