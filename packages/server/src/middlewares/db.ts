import { Response, Request, NextFunction } from "express";
import { rethinkConfig } from "@service/rethink";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import DbPool from "@service/rethink-pool";
import { DbHandle } from "@service/dbHandle";

export const pool = new DbPool(rethinkConfig);

export default async function dbMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const handle = new DbHandle(pool);

  try {
    await handle.acquire();
    req.db = handle;
  } catch (e) {
    next(new InternalServerError("database timeout"));
    return;
  }

  let released = false;
  const cleanup = async () => {
    if (released) return;
    released = true;
    clearTimeout(safetyTimeout);
    try {
      await handle.release();
    } catch (error) {
      console.error("Failed to release database connection:", error);
    }
  };

  const safetyTimeout = setTimeout(cleanup, 30000);
  res.on("close", cleanup);
  res.on("finish", cleanup);
  res.on("error", cleanup);

  next();
}
