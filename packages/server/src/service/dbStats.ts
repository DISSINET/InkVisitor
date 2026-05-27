import { Server as SocketIO } from "socket.io";
import { pool } from "@middlewares/db";
import { Db } from "@service/rethink";

export interface IDbStats {
  ts: number;
  pool: {
    size: number;
    available: number;
    borrowed: number;
    pending: number;
    max: number;
  };
  mutex: {
    locked: boolean;
    queue: number;
  };
}

/**
 * Snapshot of the rethink pool and the global write mutex - the two things
 * we care about when diagnosing contention or "connection closed" errors
 * (see issue #3014).
 */
export function collectDbStats(): IDbStats {
  return {
    ts: Date.now(),
    pool: {
      size: pool.pool.size,
      available: pool.pool.available,
      borrowed: pool.pool.size - pool.pool.available,
      pending: pool.pool.pending,
      max: pool.options.max as number,
    },
    mutex: {
      locked: Db.mutex.isLocked(),
      queue: Db.mutex.len(),
    },
  };
}

/**
 * Broadcasts a `db:stats` event to all connected sockets every `intervalMs`.
 * Returns the interval handle so the caller can stop it during shutdown if
 * needed. Also pushes a single snapshot to each freshly connected client so
 * dashboards don't have to wait up to `intervalMs` for the first value.
 */
export function startDbStatsEmitter(
  io: SocketIO,
  intervalMs = 2000
): NodeJS.Timeout {
  io.on("connection", (socket) => {
    socket.emit("db:stats", collectDbStats());
  });

  return setInterval(() => {
    io.emit("db:stats", collectDbStats());
  }, intervalMs);
}
