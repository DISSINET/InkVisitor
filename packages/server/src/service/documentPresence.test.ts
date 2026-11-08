// Stub the DB round trip that startDocumentPresence's connection handler makes
// per socket, so the socket-layer tests below stay in the DB-free unit run.
jest.mock("@middlewares/db", () => ({
  pool: {
    acquire: jest.fn(() => Promise.resolve({ connection: {} })),
    release: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("@models/user/user", () => ({
  __esModule: true,
  default: { findUserById: jest.fn(() => Promise.resolve({ name: "Alice" })) },
}));

import {
  LOCK_TTL_MS,
  claimDocumentLock,
  documentRoom,
  extendDocumentLock,
  getDocumentLock,
  releaseDocumentLock,
  releaseLocksForSocket,
  resetDocumentPresence,
  startDocumentPresence,
  sweepExpiredLocks,
} from "@service/documentPresence";

const alice = { userId: "u-alice", userName: "Alice", socketId: "s-1" };
const bob = { userId: "u-bob", userName: "Bob", socketId: "s-2" };

const DOCUMENT_EVENTS = [
  "document:watch",
  "document:unwatch",
  "document:edit:start",
  "document:edit:heartbeat",
  "document:edit:end",
] as const;

/** Bare fake standing in for a Socket.IO server: only `on` is exercised here. */
function makeFakeIo() {
  return { on: jest.fn() } as unknown as { on: jest.Mock };
}

/**
 * Fake io that records how a broadcast was addressed, so a test can tell
 * `to(room).emit(...)` apart from `to(room).except(socket).emit(...)`.
 */
function makeBroadcastingIo() {
  const emit = jest.fn();
  const except = jest.fn(() => ({ emit }));
  const to = jest.fn(() => ({ emit, except }));
  return { io: { on: jest.fn(), to }, to, except, emit };
}

/** Bare fake standing in for a Socket.IO socket: records every `on` registration. */
function makeFakeSocket(id: string, userId: string | undefined) {
  return {
    id,
    request: { session: userId ? { userId } : {} },
    on: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
  } as unknown as {
    id: string;
    request: unknown;
    on: jest.Mock;
    join: jest.Mock;
    leave: jest.Mock;
    emit: jest.Mock;
  };
}

function eventNames(mockOn: jest.Mock): string[] {
  return mockOn.mock.calls.map(([event]) => event);
}

describe("service/documentPresence", () => {
  beforeEach(() => {
    resetDocumentPresence();
  });

  it("names a room per document", () => {
    expect(documentRoom("doc-1")).toEqual("document:doc-1");
  });

  it("reports no lock for an untouched document", () => {
    expect(getDocumentLock("doc-1")).toBeNull();
  });

  it("grants the lock to the first claimant", () => {
    expect(claimDocumentLock("doc-1", alice)).toBe(true);
    expect(getDocumentLock("doc-1")).toEqual({ userId: "u-alice", userName: "Alice" });
  });

  it("refuses a second socket while the lock is held", () => {
    claimDocumentLock("doc-1", alice);
    expect(claimDocumentLock("doc-1", bob)).toBe(false);
    expect(getDocumentLock("doc-1")?.userId).toEqual("u-alice");
  });

  it("lets the holding socket re-claim, so a reconnect recovers its lock", () => {
    claimDocumentLock("doc-1", alice);
    expect(claimDocumentLock("doc-1", alice)).toBe(true);
  });

  it("keeps locks on different documents independent", () => {
    claimDocumentLock("doc-1", alice);
    expect(claimDocumentLock("doc-2", bob)).toBe(true);
    expect(getDocumentLock("doc-1")?.userId).toEqual("u-alice");
    expect(getDocumentLock("doc-2")?.userId).toEqual("u-bob");
  });

  it("releases only when the holding socket asks", () => {
    claimDocumentLock("doc-1", alice);
    expect(releaseDocumentLock("doc-1", bob.socketId)).toBe(false);
    expect(getDocumentLock("doc-1")).not.toBeNull();
    expect(releaseDocumentLock("doc-1", alice.socketId)).toBe(true);
    expect(getDocumentLock("doc-1")).toBeNull();
  });

  it("releases every lock a disconnecting socket held", () => {
    claimDocumentLock("doc-1", alice);
    claimDocumentLock("doc-2", alice);
    claimDocumentLock("doc-3", bob);

    releaseLocksForSocket(alice.socketId);

    expect(getDocumentLock("doc-1")).toBeNull();
    expect(getDocumentLock("doc-2")).toBeNull();
    expect(getDocumentLock("doc-3")?.userId).toEqual("u-bob");
  });

  it("treats a lock past its TTL as absent", () => {
    const t0 = 1_000_000;
    claimDocumentLock("doc-1", alice, t0);
    expect(getDocumentLock("doc-1", t0 + LOCK_TTL_MS - 1)).not.toBeNull();
    expect(getDocumentLock("doc-1", t0 + LOCK_TTL_MS)).toBeNull();
  });

  it("lets another socket claim a document whose lock has expired", () => {
    const t0 = 1_000_000;
    claimDocumentLock("doc-1", alice, t0);
    expect(claimDocumentLock("doc-1", bob, t0 + LOCK_TTL_MS)).toBe(true);
    expect(getDocumentLock("doc-1", t0 + LOCK_TTL_MS)?.userId).toEqual("u-bob");
  });

  it("extends the deadline for the holder and nobody else", () => {
    const t0 = 1_000_000;
    claimDocumentLock("doc-1", alice, t0);

    expect(extendDocumentLock("doc-1", bob.socketId, t0 + 1000)).toBe(false);
    expect(extendDocumentLock("doc-1", alice.socketId, t0 + 1000)).toBe(true);

    expect(getDocumentLock("doc-1", t0 + LOCK_TTL_MS + 500)).not.toBeNull();
  });

  it("does not resurrect an already-expired lock via heartbeat", () => {
    const t0 = 1_000_000;
    claimDocumentLock("doc-1", alice, t0);
    expect(extendDocumentLock("doc-1", alice.socketId, t0 + LOCK_TTL_MS)).toBe(false);
  });

  it("drops expired entries when swept", () => {
    const t0 = 1_000_000;
    claimDocumentLock("doc-1", alice, t0);
    claimDocumentLock("doc-2", bob, t0 + LOCK_TTL_MS);

    sweepExpiredLocks(t0 + LOCK_TTL_MS);

    expect(getDocumentLock("doc-1", t0 + LOCK_TTL_MS)).toBeNull();
    expect(getDocumentLock("doc-2", t0 + LOCK_TTL_MS)).not.toBeNull();
  });

  describe("lock broadcasts", () => {
    let sweepTimer: NodeJS.Timeout;

    afterEach(() => {
      clearInterval(sweepTimer);
    });

    it("leaves the claiming socket out of its own claim broadcast", () => {
      const { io, to, except, emit } = makeBroadcastingIo();
      sweepTimer = startDocumentPresence(io as never);

      claimDocumentLock("doc-1", alice);

      expect(to).toHaveBeenCalledWith("document:doc-1");
      // The claimer learns the outcome from its edit:start ack. Telling it again
      // races that ack and briefly names it as somebody else holding the lock.
      expect(except).toHaveBeenCalledWith("s-1");
      expect(emit).toHaveBeenCalledWith("document:lock", {
        documentId: "doc-1",
        lock: { userId: "u-alice", userName: "Alice" },
      });
    });

    it("tells the whole room when a lock is released", () => {
      const { io, to, except, emit } = makeBroadcastingIo();
      sweepTimer = startDocumentPresence(io as never);

      claimDocumentLock("doc-1", alice);
      except.mockClear();
      emit.mockClear();

      releaseDocumentLock("doc-1", alice.socketId);

      expect(to).toHaveBeenCalledWith("document:doc-1");
      expect(except).not.toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith("document:lock", {
        documentId: "doc-1",
        lock: null,
      });
    });
  });

  describe("startDocumentPresence connection handler", () => {
    let sweepTimer: NodeJS.Timeout;

    afterEach(() => {
      clearInterval(sweepTimer);
    });

    it("registers every document listener synchronously, before the session lookup resolves", () => {
      const fakeIo = makeFakeIo();
      sweepTimer = startDocumentPresence(fakeIo as never);

      const connectionHandler = fakeIo.on.mock.calls.find(
        ([event]) => event === "connection"
      )?.[1];
      expect(connectionHandler).toBeDefined();

      const socket = makeFakeSocket("s-1", "u-alice");
      // Deliberately not awaited: the pool.acquire()/findUserById() lookup
      // triggered inside the handler is still pending here. If listener
      // registration were gated behind that lookup - the bug this test pins -
      // none of the assertions below would see a call yet.
      connectionHandler(socket);

      const registered = eventNames(socket.on);
      for (const event of DOCUMENT_EVENTS) {
        expect(registered).toContain(event);
      }
      expect(registered).toContain("disconnect");
    });

    it("registers no document listeners for a socket with no session", () => {
      const fakeIo = makeFakeIo();
      sweepTimer = startDocumentPresence(fakeIo as never);

      const connectionHandler = fakeIo.on.mock.calls.find(
        ([event]) => event === "connection"
      )?.[1];
      expect(connectionHandler).toBeDefined();

      const socket = makeFakeSocket("s-2", undefined);
      connectionHandler(socket);

      expect(socket.on).not.toHaveBeenCalled();
    });
  });
});
