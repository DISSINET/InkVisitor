import { Server as SocketIO, Socket } from "socket.io";
import { EventType } from "@inkvisitor/shared/types/stats";
import User from "@models/user/user";
import { pool } from "@middlewares/db";

/** Lock state as broadcast to clients - no socket id, no deadline. */
export interface IDocumentLock {
  userId: string;
  userName: string;
}

interface LockEntry extends IDocumentLock {
  socketId: string;
  expiresAt: number;
}

export const LOCK_TTL_MS = 60_000;
const SWEEP_INTERVAL_MS = 10_000;

/**
 * Locks are held in this process's memory, which is correct only while the
 * server runs as a single process. Scaling out needs a Socket.IO adapter and
 * shared lock state.
 */
const locks = new Map<string, LockEntry>();
let io: SocketIO | undefined;

export function documentRoom(documentId: string): string {
  return `document:${documentId}`;
}

/** Drops all state. Tests call this between cases. */
export function resetDocumentPresence(): void {
  locks.clear();
  io = undefined;
}

/**
 * Current holder, or null. Expiry is checked on read as well as by the sweeper,
 * so a caller never sees a lock that outlived its TTL between sweeps.
 */
export function getDocumentLock(
  documentId: string,
  now: number = Date.now()
): IDocumentLock | null {
  const entry = locks.get(documentId);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= now) {
    locks.delete(documentId);
    return null;
  }
  return { userId: entry.userId, userName: entry.userName };
}

function broadcastLock(documentId: string): void {
  io?.to(documentRoom(documentId)).emit("document:lock", {
    documentId,
    lock: getDocumentLock(documentId),
  });
}

/**
 * Claims the lock for a socket. The holding socket re-claiming is a success and
 * refreshes the deadline, which is the path a reconnecting client takes.
 * @returns whether the caller holds the lock afterwards
 */
export function claimDocumentLock(
  documentId: string,
  holder: { userId: string; userName: string; socketId: string },
  now: number = Date.now()
): boolean {
  const current = locks.get(documentId);
  if (current && current.expiresAt > now && current.socketId !== holder.socketId) {
    return false;
  }
  locks.set(documentId, { ...holder, expiresAt: now + LOCK_TTL_MS });
  broadcastLock(documentId);
  return true;
}

/**
 * Pushes the deadline out for a lock the socket already holds. Silent - a
 * heartbeat every 20s must not put a broadcast on the room every 20s.
 * @returns whether a live lock was extended
 */
export function extendDocumentLock(
  documentId: string,
  socketId: string,
  now: number = Date.now()
): boolean {
  const current = locks.get(documentId);
  if (!current || current.socketId !== socketId || current.expiresAt <= now) {
    return false;
  }
  current.expiresAt = now + LOCK_TTL_MS;
  return true;
}

/** @returns whether this socket held the lock and it was dropped */
export function releaseDocumentLock(documentId: string, socketId: string): boolean {
  const current = locks.get(documentId);
  if (!current || current.socketId !== socketId) {
    return false;
  }
  locks.delete(documentId);
  broadcastLock(documentId);
  return true;
}

export function releaseLocksForSocket(socketId: string): void {
  for (const [documentId, entry] of locks) {
    if (entry.socketId === socketId) {
      locks.delete(documentId);
      broadcastLock(documentId);
    }
  }
}

export function sweepExpiredLocks(now: number = Date.now()): void {
  for (const [documentId, entry] of locks) {
    if (entry.expiresAt <= now) {
      locks.delete(documentId);
      broadcastLock(documentId);
    }
  }
}

/**
 * Tells everyone watching a document that it was written. The originating
 * socket is excluded so the tab that made the change does not refetch its own
 * write; a second tab of the same user still receives it. Without an origin the
 * whole room is told, which costs one redundant refetch.
 */
export function emitDocumentChanged(params: {
  documentId: string;
  userId: string;
  userName: string;
  eventType: EventType;
  originSocketId?: string;
}): void {
  if (!io) {
    return;
  }
  const room = io.to(documentRoom(params.documentId));
  const target = params.originSocketId ? room.except(params.originSocketId) : room;
  target.emit("document:changed", {
    documentId: params.documentId,
    userId: params.userId,
    userName: params.userName,
    eventType: params.eventType,
  });
}

/**
 * Registers the document presence protocol on the Socket.IO server and starts
 * the TTL sweeper. Sockets without a session are ignored - an anonymous socket
 * can neither watch a document nor hold a lock.
 */
export function startDocumentPresence(socketio: SocketIO): NodeJS.Timeout {
  io = socketio;

  socketio.on("connection", async (socket: Socket) => {
    const request = socket.request as import("express").Request;
    const userId = request.session?.userId;
    if (!userId) {
      return;
    }

    let userName = "";
    const db = await pool.acquire();
    try {
      const user = await User.findUserById(db.connection, userId);
      if (!user) {
        return;
      }
      userName = user.name;
    } finally {
      await pool.release(db);
    }

    socket.on("document:watch", ({ documentId }: { documentId?: string }) => {
      if (!documentId) return;
      socket.join(documentRoom(documentId));
      socket.emit("document:lock", { documentId, lock: getDocumentLock(documentId) });
    });

    socket.on("document:unwatch", ({ documentId }: { documentId?: string }) => {
      if (!documentId) return;
      releaseDocumentLock(documentId, socket.id);
      socket.leave(documentRoom(documentId));
    });

    socket.on(
      "document:edit:start",
      (
        { documentId }: { documentId?: string },
        callback?: (result: { granted: boolean }) => void
      ) => {
        if (!documentId) return;
        const granted = claimDocumentLock(documentId, {
          userId,
          userName,
          socketId: socket.id,
        });
        callback?.({ granted });
      }
    );

    socket.on("document:edit:heartbeat", ({ documentId }: { documentId?: string }) => {
      if (!documentId) return;
      extendDocumentLock(documentId, socket.id);
    });

    socket.on("document:edit:end", ({ documentId }: { documentId?: string }) => {
      if (!documentId) return;
      releaseDocumentLock(documentId, socket.id);
    });

    socket.on("disconnect", () => {
      releaseLocksForSocket(socket.id);
    });
  });

  return setInterval(() => sweepExpiredLocks(), SWEEP_INTERVAL_MS);
}
