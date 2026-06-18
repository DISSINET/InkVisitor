import { Response, Request, NextFunction } from "express";
import { rethinkConfig } from "@service/rethink";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import DbPool from "@service/rethink-pool";
import { DbHandle } from "@service/dbHandle";

export const pool = new DbPool(rethinkConfig);

// Dedicated pool for the session store. It MUST NOT share `pool`: express-session
// writes the session inside its res.end wrapper (every request, because rolling is
// on) while dbMiddleware still holds this request's connection until 'finish'. With
// a single pool every in-flight request would need two connections at once, which
// deadlocks the pool the moment the client fires a burst of parallel requests.
// A separate, smaller pool decouples session I/O from request I/O entirely.
export const sessionPool = new DbPool({
  ...rethinkConfig,
  max: parseInt(process.env.SESSION_POOL_CONNECTIONS || "", 10) || 5,
});

// Tests and shutdown tear pools down via `pool.end()`. Drain the session pool from
// the same call so its evictor timer / idle connections don't keep the process
// (and Jest) alive - this keeps the existing teardown call sites unchanged.
const endRequestPool = pool.end.bind(pool);
pool.end = async () => {
  await Promise.all([endRequestPool(), sessionPool.end()]);
};

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
