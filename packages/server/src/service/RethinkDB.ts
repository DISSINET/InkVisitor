import { Connection, r as rethink } from "rethinkdb-ts";
import { Request, Response } from "express";

export const rethinkConfig = {
  db: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process?.env?.DB_PORT || "28015"),
  password: process.env.DB_AUTH,
};

let locked: boolean = false;
const queue: awaiter[] = [];

interface awaiter {
  onSuccess: (value: unknown) => void
  onError: (reason?: any) => void,
  index?: number;
}

export class Db {
  connection: Connection = {} as Connection;
  isLocker: boolean = false;
  lockAwaiter?: awaiter;

  constructor() {
    if (!rethinkConfig.db || !rethinkConfig.host || !rethinkConfig.port) {
      throw new Error("Missing db params, check env vars");
    }
  }

  async lock() {
    if (locked) {
      await this.waitForUnlock();
    }
    this.isLocker = true;
    locked = true;
  }

  unlock() {
    while (queue.length) {
      const awaitingCbs = queue.shift()
      if (awaitingCbs) {
        if (awaitingCbs.index === undefined) {
          continue;
        }
        awaitingCbs.index = undefined;
        awaitingCbs.onSuccess(null);
      }
    }

    locked = false;
  }

  async waitForUnlock(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.lockAwaiter = { onSuccess: resolve, onError: reject, index: queue.length };
      queue.push(this.lockAwaiter);
    })
  }

  async initDb(): Promise<void> {
    this.connection = await rethink.connect({
      ...rethinkConfig,
      timeout: 2, // important -  close will wait for this seconds
    });
  }

  async close() {
    if (this.lockAwaiter && this.lockAwaiter.index !== undefined) {
      queue.splice(this.lockAwaiter.index, 1)
    }
    if (this.isLocker) {
      this.unlock();
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
