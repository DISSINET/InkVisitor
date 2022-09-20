import { Response, Request, NextFunction } from "express";
import { createConnection, closeConnection } from "@service/RethinkDB";

export default async function dbMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await createConnection(req);

  res.on('close', function () {
    if (req.db.lockAwaiter) {
      req.db.lockAwaiter.onError(new Error("client closed the connection"));
    }
    closeConnection(req);
  });

  next();
}
