import {
  Connection,
  r as rethink,
  isRethinkDBError,
  MasterPool,
} from "rethinkdb-ts";
import { Express, NextFunction, Request, Response } from "express";
import { RethinkDBError } from "rethinkdb-ts/lib/error/error";

declare global {
  namespace Express {
    export interface Request {
      db: Db;
    }
  }
}

export const rethinkConfig = {
  db: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process?.env?.DB_PORT || "28015"),
  password: process.env.DB_AUTH,
};

export class Db {
  connection?: Connection;

  constructor() {
    if (!rethinkConfig.db || !rethinkConfig.host || !rethinkConfig.port) {
      throw new Error("Missing db params, check env vars");
    }
  }

  async initDb(): Promise<void> {
    this.connection = await rethink.connect(rethinkConfig);
  }

  close() {
    if (this.connection) {
      this.connection.close();
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
export const createConnection = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  request.db = new Db();
  await request.db.initDb();
  console.log("connected to db");
  next();
};

/*
 * Close the RethinkDB connection stored in `request.rethink`.
 */
export const closeConnection = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  await request.db.close();
};
