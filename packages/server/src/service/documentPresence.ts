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

/**
 * @param exceptSocketId a socket that already learns the outcome from its own
 * ack. Telling it again races that ack: the broadcast names it as the holder
 * while its `granted` flag is still false, which reads as "somebody else is
 * editing" for as long as the round trip takes.
 */
function broadcastLock(documentId: string, exceptSocketId?: string): void {
  if (!io) {
    return;
  }
  const room = io.to(documentRoom(documentId));
  const target = exceptSocketId ? room.except(exceptSocketId) : room;
  target.emit("document:lock", {
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
  broadcastLock(documentId, holder.socketId);
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

interface LockHolder {
  userId: string;
  userName: string;
  socketId: string;
}

/**
 * Looks up the socket's session user once per connection. Callers await this
 * rather than blocking listener registration on it - socket.io delivers
 * "connection" and then dispatches incoming packets through a plain
 * EventEmitter with no buffering, so any socket.on() added after an await
 * misses events that arrive before that await resolves.
 */
async function resolveLockHolder(
  userId: string,
  socketId: string
): Promise<LockHolder | null> {
  const db = await pool.acquire();
  try {
    const user = await User.findUserById(db.connection, userId);
    if (!user) {
      return null;
    }
    return { userId, userName: user.name, socketId };
  } finally {
    await pool.release(db);
  }
}

/**
 * Registers the document presence protocol on the Socket.IO server and starts
 * the TTL sweeper. Sockets without a session are ignored - an anonymous socket
 * can neither watch a document nor hold a lock.
 */
export function startDocumentPresence(socketio: SocketIO): NodeJS.Timeout {
  io = socketio;

  socketio.on("connection", (socket: Socket) => {
    const request = socket.request as import("express").Request;
    const userId = request.session?.userId;
    if (!userId) {
      return;
    }

    const holder = resolveLockHolder(userId, socket.id);

    socket.on("document:watch", async ({ documentId }: { documentId?: string }) => {
      if (!documentId) return;
      if (!(await holder)) return;
      socket.join(documentRoom(documentId));
      socket.emit("document:lock", { documentId, lock: getDocumentLock(documentId) });
    });

    socket.on("document:unwatch", async ({ documentId }: { documentId?: string }) => {
      if (!documentId) return;
      if (!(await holder)) return;
      releaseDocumentLock(documentId, socket.id);
      socket.leave(documentRoom(documentId));
    });

    socket.on(
      "document:edit:start",
      async (
        { documentId }: { documentId?: string },
        callback?: (result: { granted: boolean }) => void
      ) => {
        if (!documentId) return;
        const resolved = await holder;
        if (!resolved) {
          callback?.({ granted: false });
          return;
        }
        const granted = claimDocumentLock(documentId, resolved);
        callback?.({ granted });
      }
    );

    socket.on(
      "document:edit:heartbeat",
      async ({ documentId }: { documentId?: string }) => {
        if (!documentId) return;
        if (!(await holder)) return;
        extendDocumentLock(documentId, socket.id);
      }
    );

    socket.on("document:edit:end", async ({ documentId }: { documentId?: string }) => {
      if (!documentId) return;
      if (!(await holder)) return;
      releaseDocumentLock(documentId, socket.id);
    });

    socket.on("disconnect", () => {
      releaseLocksForSocket(socket.id);
    });
  });

  return setInterval(() => sweepExpiredLocks(), SWEEP_INTERVAL_MS);
}
