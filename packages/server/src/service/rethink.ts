import { Connection, r as rethink } from "rethinkdb-ts";
import { Response } from "express";
import { Mutex } from "./mutex";

export const rethinkConfig = {
  db: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process?.env?.DB_PORT || "28015"),
  password: process.env.DB_AUTH,
  max: parseInt(process.env.DB_POOL_CONNECTIONS || "10") || 10,
  acquireTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
};

export class Db {
  // Global write mutex; owned here so DbHandle (per-request wrapper) can use it.
  static mutex = new Mutex();

  connection: Connection = {} as Connection;

  constructor() {
    if (!rethinkConfig.db || !rethinkConfig.host || !rethinkConfig.port) {
      throw new Error("Missing db params, check env vars");
    }
  }

  async initDb(): Promise<void> {
    this.connection = await rethink.connect({
      ...rethinkConfig,
      timeout: 30, // important - close will wait for this seconds
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
