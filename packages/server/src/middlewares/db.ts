import { Response, Request, NextFunction } from "express";
import { Db, rethinkConfig } from "@service/rethink";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import DbPool from "@service/rethink-pool";

export const pool = new DbPool(rethinkConfig);

export default async function dbMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let db: Db | undefined = undefined;

  // Acquire the database connection and store reference for later 
  try {
    db = await pool.acquire();
    req.db = db;
  } catch (e) {
    next(new InternalServerError("database timeout"));
    return;
  }

  // Cleanup function - runs on client disconnect, response finish, or any error
  const cleanup = async () => {
    if (db) {
      let localDb = db;
      db = undefined;
      try {
        if (localDb.lockAwaiter) {
          localDb.lockAwaiter.onError(new Error("client closed the connection"));
        }
        
        await pool.release(localDb);
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error("Failed to release database connection:", error);
        db = localDb; // let the timeout to scrape the connection
      }
    }
  };

  // Safety timeout to ensure connection is released even if close handler doesn't fire
  const safetyTimeout = setTimeout(cleanup, 30000); // 30 second safety timeout

  // Cleanup on client disconnect
  res.on("close", cleanup);

  // Cleanup on response finish (successful completion)
  res.on("finish", cleanup);

  // Cleanup on any error
  res.on("error", cleanup);

  next();
}
