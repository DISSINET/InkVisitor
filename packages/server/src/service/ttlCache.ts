interface Entry {
  value: unknown;
  expiresAt: number;
}

/**
 * Process-wide in-memory cache. Keys are strings (namespace your own:
 * `user:byId:<id>`, `tree:foo`, etc.), values are anything.
 *
 * The caller asserts the type on `get<T>()` - no runtime check.
 * TTL is per-entry, supplied on `set()`.
 *
 * Expiry is lazy on read (no background timer).
 */
export class TtlCache {
  private readonly store = new Map<string, Entry>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Clone on read so caller mutations cannot reach the stored value.
    return structuredClone(entry.value) as T;
  }

  set(key: string, value: unknown, ttlMs?: number): void {
    // Re-insertion bumps Map insertion order, useful if eviction is added later.
    this.store.delete(key);
    // Clone on write so later mutations of the caller-side reference cannot
    // reach the stored value.
    // Omitting ttlMs stores the entry without an expiry - useful when an
    // external mechanism (e.g. a changefeed) owns invalidation.
    this.store.set(key, {
      value: structuredClone(value),
      expiresAt: ttlMs === undefined ? Infinity : Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deletePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

export const cache = new TtlCache();
