interface Entry {
  value: unknown;
  expiresAt: number;
}

export interface TtlCacheOptions {
  /**
   * Maximum entries kept in the store. When exceeded, the least-recently
   * used (by `get`/`set` order) entries are dropped. Defaults to Infinity.
   */
  maxEntries?: number;
}

/**
 * Process-wide in-memory cache. Keys are strings (namespace your own:
 * `user:byId:<id>`, `tree:foo`, etc.), values are anything.
 *
 * The caller asserts the type on `get<T>()` - no runtime check.
 * TTL is per-entry, supplied on `set()` (or omitted for no expiry).
 *
 * Expiry is lazy on read (no background timer). Eviction is LRU when
 * `maxEntries` is set: `get` re-inserts the hit entry to refresh
 * insertion order, `set` drops the oldest entry when the bound is
 * exceeded.
 *
 * For read-during-write race safety, use `snapshot(key)` before the DB
 * read and `trySet(key, value, ttlMs, expectedVersion)` after - any
 * invalidation that happened between the two will reject the set. See
 * the in-flight tests for the exact semantics.
 */
export class TtlCache {
  private readonly store = new Map<string, Entry>();
  // Per-key invalidation generation. `delete` (and `deletePrefix`, `clear`)
  // bump the version. `snapshot` registers the key with version 0 if not
  // present, so a later `deletePrefix`/`clear` can still bump in-flight
  // readers' versions before their `trySet` lands.
  //
  // Versions are NOT cleared on eviction or expiry: an in-flight reader's
  // snapshot must remain comparable for the lifetime of its DB read.
  // Growth is one number per unique key ever touched.
  private readonly versions = new Map<string, number>();
  private readonly maxEntries: number;

  constructor(options: TtlCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? Infinity;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // LRU refresh: re-insert so this key is now the newest in iteration
    // order. Next eviction will start from the actually-least-recently-used.
    this.store.delete(key);
    this.store.set(key, entry);
    // Clone on read so caller mutations cannot reach the stored value.
    return structuredClone(entry.value) as T;
  }

  /**
   * Read the current invalidation version of `key`. Pair with `trySet`:
   * take a snapshot *before* the DB read, hand it back to `trySet` after.
   * If any `delete` / `deletePrefix` / `clear` ran in between, `trySet`
   * sees the bump and refuses to store the (potentially stale) value.
   *
   * Registers a zero-version entry for previously-unseen keys, so
   * later `deletePrefix` / `clear` calls can still bump them.
   */
  snapshot(key: string): number {
    const existing = this.versions.get(key);
    if (existing !== undefined) {
      return existing;
    }
    this.versions.set(key, 0);
    return 0;
  }

  set(key: string, value: unknown, ttlMs?: number): void {
    // Re-insertion bumps Map insertion order; combined with `evictIfOverflow`
    // below this gives LRU semantics.
    this.store.delete(key);
    // Clone on write so later mutations of the caller-side reference cannot
    // reach the stored value.
    // Omitting ttlMs stores the entry without an expiry - useful when an
    // external mechanism (e.g. a changefeed) owns invalidation.
    this.store.set(key, {
      value: structuredClone(value),
      expiresAt: ttlMs === undefined ? Infinity : Date.now() + ttlMs,
    });
    this.evictIfOverflow();
  }

  /**
   * Store iff the key's version still matches `expectedVersion`. Returns
   * true on success, false if the version moved (i.e. an invalidation
   * fired between snapshot and trySet - the value may be stale, so we
   * refuse to populate the cache with it).
   */
  trySet(
    key: string,
    value: unknown,
    ttlMs: number | undefined,
    expectedVersion: number
  ): boolean {
    const current = this.versions.get(key) ?? 0;
    if (current !== expectedVersion) {
      return false;
    }
    this.set(key, value, ttlMs);
    return true;
  }

  delete(key: string): void {
    this.store.delete(key);
    this.versions.set(key, (this.versions.get(key) ?? 0) + 1);
  }

  deletePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    // Bump versions for matching keys in versions (catches in-flight
    // readers that snapshotted a key whose entry isn't in `store` yet).
    for (const [key, v] of this.versions) {
      if (key.startsWith(prefix)) {
        this.versions.set(key, v + 1);
      }
    }
  }

  clear(): void {
    this.store.clear();
    // Bump (not delete) every known version so any in-flight reader's
    // snapshot fails its trySet.
    for (const [key, v] of this.versions) {
      this.versions.set(key, v + 1);
    }
  }

  get size(): number {
    return this.store.size;
  }

  /**
   * Drops oldest entries until size <= maxEntries. Does not bump versions:
   * the evicted value was still fresh, so a concurrent `trySet` for the
   * same key may safely re-populate. A genuine invalidation goes through
   * `delete` / `deletePrefix` / `clear`, all of which bump versions.
   */
  private evictIfOverflow(): void {
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) return;
      this.store.delete(oldest);
    }
  }
}

// Single shared instance. The 10_000-entry cap targets the entity cache;
// users (low tens) and settings (single key) easily fit within it.
// `get`-based LRU refresh keeps hot user/settings entries from being
// evicted by entity churn.
export const cache = new TtlCache({ maxEntries: 10_000 });
