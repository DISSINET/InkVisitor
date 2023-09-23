import { Response, Request, NextFunction } from "express";
import { rethinkConfig } from "@service/rethink";
import { InternalServerError } from "@shared/types/errors";
import DbPool from "@service/rethink-pool";

const pool = new DbPool(rethinkConfig);

export default async function dbMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    req.db = await pool.acquire();
  } catch (e) {
    next(new InternalServerError("database timeout"));
    return;
  }

  res.on("close", async function () {
    if (req.db.lockInstance) {
      req.db.lockInstance.onError(new Error("client closed the connection"));
    }

    await pool.release(req.db);
  });

  next();
}
