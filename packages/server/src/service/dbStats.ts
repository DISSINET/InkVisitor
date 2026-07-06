import { Server as SocketIO } from "socket.io";
import { UserEnums } from "@inkvisitor/shared/enums";
import User from "@models/user/user";
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

const DB_STATS_ROOM = "db:stats:privileged";

function isPrivilegedRole(role: UserEnums.Role | undefined): boolean {
  return role === UserEnums.Role.Owner || role === UserEnums.Role.Admin;
}

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

async function getSessionUserId(
  req: import("express").Request
): Promise<string | undefined> {
  return req.session?.userId;
}

export function startDbStatsEmitter(
  io: SocketIO,
  intervalMs = 2000
): NodeJS.Timeout {
  io.on("connection", async (socket) => {
    const userId = await getSessionUserId(
      socket.request as import("express").Request
    );
    if (!userId) {
      return;
    }

    const db = await pool.acquire();
    try {
      const user = await User.findUserById(db.connection, userId);
      if (!user || !isPrivilegedRole(user.role)) {
        return;
      }
    } finally {
      await pool.release(db);
    }

    socket.join(DB_STATS_ROOM);
    socket.emit("db:stats", collectDbStats());
  });

  return setInterval(() => {
    io.to(DB_STATS_ROOM).emit("db:stats", collectDbStats());
  }, intervalMs);
}
