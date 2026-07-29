import {
  LOCK_TTL_MS,
  claimDocumentLock,
  documentRoom,
  extendDocumentLock,
  getDocumentLock,
  releaseDocumentLock,
  releaseLocksForSocket,
  resetDocumentPresence,
  sweepExpiredLocks,
} from "@service/documentPresence";

const alice = { userId: "u-alice", userName: "Alice", socketId: "s-1" };
const bob = { userId: "u-bob", userName: "Bob", socketId: "s-2" };

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
});
