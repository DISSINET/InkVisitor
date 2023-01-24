import { Response, Request, NextFunction } from "express";
import { createConnection, closeConnection, Db } from "@service/RethinkDB";
import { IRequest } from "src/custom_typings/request";
import { newMockRequest } from "@modules/common.test";
import { InternalServerError } from "@shared/types/errors";

export default async function dbMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await createConnection(req);
  } catch (e) {
    next(new InternalServerError("database timeout"));
  }

  res.on('close', function () {
    if (req.db.lockInstance) {
      req.db.lockInstance.onError(new Error("client closed the connection"));
    }
    closeConnection(req);
  });

  next();
}
