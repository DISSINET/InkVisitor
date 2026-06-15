import { Query } from "@inkvisitor/shared/types/query";

const BASE_QUERY_CACHE_TTL_MS = 5 * 60 * 1000;
const BASE_QUERY_CACHE_MAX_ENTRIES = 24;

interface CacheEntry {
  ids: string[];
  cachedAt: number;
}

const baseQueryResultsCache = new Map<string, CacheEntry>();

const stableStringify = (value: unknown): string => {
  return JSON.stringify(value, (_key, val) => {
    if (!val || typeof val !== "object" || Array.isArray(val)) {
      return val;
    }
    const obj = val as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    Object.keys(obj)
      .sort()
      .forEach((k) => {
        sorted[k] = obj[k];
      });
    return sorted;
  });
};

export const queryCacheKey = (query: Query.INode): string => stableStringify(query);

export const getCachedBaseIds = (key: string): string[] | null => {
  const entry = baseQueryResultsCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.cachedAt > BASE_QUERY_CACHE_TTL_MS) {
    baseQueryResultsCache.delete(key);
    return null;
  }
  return [...entry.ids];
};

export const setCachedBaseIds = (key: string, ids: string[]): void => {
  if (baseQueryResultsCache.size >= BASE_QUERY_CACHE_MAX_ENTRIES) {
    let oldestKey: string | undefined;
    let oldestAt = Infinity;
    for (const [cacheKey, entry] of baseQueryResultsCache) {
      if (entry.cachedAt < oldestAt) {
        oldestAt = entry.cachedAt;
        oldestKey = cacheKey;
      }
    }
    if (oldestKey) {
      baseQueryResultsCache.delete(oldestKey);
    }
  }

  baseQueryResultsCache.set(key, {
    ids: [...ids],
    cachedAt: Date.now(),
  });
};

/** @internal test helper */
export const clearQueryBaseCache = (): void => {
  baseQueryResultsCache.clear();
};
