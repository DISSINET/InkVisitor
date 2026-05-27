import { Connection } from "rethinkdb-ts";
import { Db } from "./rethink";
import { Awaiter } from "./mutex";
import DbPool from "./rethink-pool";

/**
 * Per-request wrapper around a pooled Db.
 *
 * Why this exists: the global write mutex (Db.mutex) used to be acquired
 * *while* a pool slot was already held by the middleware. That serialized
 * pool occupancy across all writers in flight - the 11th concurrent write
 * couldn't even get a connection to queue.
 *
 * DbHandle decouples the two resources. lock() yields the pool slot during
 * the mutex wait so other requests (especially read-only ones) can still
 * borrow connections, and reacquires a fresh slot once the mutex is held.
 *
 * Read-only handlers are unaffected - acquire() at request start, release()
 * on response end, same as before.
 */
export class DbHandle {
  private _db: Db | null = null;
  lockAwaiter?: Awaiter;

  constructor(private pool: DbPool) {}

  /**
   * Acquire a connection from the pool. Idempotent.
   */
  async acquire(): Promise<void> {
    if (this._db) return;
    this._db = await this.pool.acquire();
  }

  /**
   * Release the connection back to the pool and unlock the write mutex if
   * we hold it. Idempotent.
   */
  async release(): Promise<void> {
    if (this.lockAwaiter) {
      // Reject any handler still awaiting lock(), then drop the mutex hold.
      this.lockAwaiter.onError(new Error("client closed the connection"));
      Db.mutex.unlock(this.lockAwaiter);
      this.lockAwaiter = undefined;
    }
    if (this._db) {
      const db = this._db;
      this._db = null;
      await this.pool.release(db);
    }
  }

  /**
   * Acquire the global write mutex. If another writer is already holding the
   * mutex, yield the pool slot during the wait so it can be used by readers
   * and reacquire a fresh slot once the mutex is granted. When the mutex is
   * free, skip the dance entirely - we'll grab it instantly and there's no
   * benefit to round-tripping through the pool.
   */
  async lock(): Promise<void> {
    const shouldYield = this._db !== null && Db.mutex.isLocked();

    if (shouldYield) {
      const db = this._db as Db;
      this._db = null;
      await this.pool.release(db);
    }

    this.lockAwaiter = new Awaiter();
    try {
      await Db.mutex.lock(this.lockAwaiter);
    } catch (err) {
      // Mutex.lock can reject if cleanup fires onError mid-wait
      // (e.g. client disconnect). Don't leak the awaiter.
      this.lockAwaiter = undefined;
      throw err;
    }

    if (shouldYield) {
      try {
        this._db = await this.pool.acquire();
      } catch (err) {
        // Reacquire failed (pool exhausted / DB down). Release the mutex
        // we just took so subsequent writers aren't stuck behind us.
        Db.mutex.unlock(this.lockAwaiter);
        this.lockAwaiter = undefined;
        throw err;
      }
    }
  }

  /**
   * Sync accessor for handler code. Throws clearly if the handle hasn't
   * acquired a connection yet (typically meaning lock() was called and
   * is still mid-yield, or the handle was used after release()).
   */
  get connection(): Connection {
    if (!this._db) {
      throw new Error(
        "DbHandle: no connection acquired - if you called lock(), await it first"
      );
    }
    return this._db.connection;
  }
}
