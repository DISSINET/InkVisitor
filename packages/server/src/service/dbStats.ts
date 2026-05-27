import { Server as SocketIO } from "socket.io";
import { UserEnums } from "@inkvisitor/shared/enums";
import { verifyJwtToken } from "@common/auth";
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

// Sockets whose handshake JWT identifies an Admin/Owner join this room and
// are the only ones that receive `db:stats` events.
const DB_STATS_ROOM = "db:stats:privileged";

function isPrivilegedRole(role: UserEnums.Role | undefined): boolean {
  return role === UserEnums.Role.Owner || role === UserEnums.Role.Admin;
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
 * Broadcasts a `db:stats` event every `intervalMs`, but only to sockets whose
 * handshake JWT belongs to an Admin or Owner. Non-privileged or unauthenticated
 * sockets neither join the room nor receive an initial snapshot, so the data
 * is not exposed to ordinary users via the websocket.
 *
 * Returns the interval handle so the caller can stop it during shutdown.
 */
export function startDbStatsEmitter(
  io: SocketIO,
  intervalMs = 2000
): NodeJS.Timeout {
  io.on("connection", (socket) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.query?.token as string | undefined);
    const user = token ? verifyJwtToken(token) : null;
    if (!user || !isPrivilegedRole(user.role)) {
      return;
    }
    socket.join(DB_STATS_ROOM);
    socket.emit("db:stats", collectDbStats());
  });

  return setInterval(() => {
    io.to(DB_STATS_ROOM).emit("db:stats", collectDbStats());
  }, intervalMs);
}
