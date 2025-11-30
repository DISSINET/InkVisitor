import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { IResponseQuery, IResponseQueryEntity } from "@shared/types";
import { Explore, Query } from "@shared/types/query";
import api from "api";
import { QueryValidity } from "./types";

interface UseQueryDataParams {
  queryState: Query.INode;
  exploreState: Explore.IExplore;
  stableSignature: string;
  queryStateValidity: QueryValidity;
}

interface UseQueryDataReturn {
  data: IResponseQuery | undefined;
  error: Error | null;
  isFetching: boolean;
}

/**
 * Row-based cache for a specific query signature.
 * Maps row index → entity data.
 */
interface RowCache {
  signature: string;
  rows: Map<number, IResponseQueryEntity>;
  total: number;
}

// Global cache storage keyed by signature
// This persists across component re-renders but resets on page reload
const rowCacheStore = new Map<string, RowCache>();

/**
 * Custom hook that manages query data fetching with intelligent row-level caching.
 *
 * Features:
 * - Stores individual rows in a consolidated cache (not separate query windows)
 * - Checks if all requested rows are already cached before fetching
 * - Reuses cached rows to avoid redundant network requests
 * - Automatically merges new data into the row cache
 * - Keeps cached rows indefinitely per session
 *
 * Example:
 * - Fetch rows [0-30] → Cache stores rows 0,1,2...30
 * - Request rows [5-10] → Check cache, find all rows cached → Skip fetch ✅
 * - Request rows [25-35] → Find rows 25-30 cached, rows 31-35 missing → Fetch [25-35]
 */
export const useQueryData = ({
  queryState,
  exploreState,
  stableSignature,
  queryStateValidity,
}: UseQueryDataParams): UseQueryDataReturn => {
  const queryClient = useQueryClient();

  // Get or create row cache for this signature
  const getRowCache = (): RowCache => {
    if (!rowCacheStore.has(stableSignature)) {
      rowCacheStore.set(stableSignature, {
        signature: stableSignature,
        rows: new Map(),
        total: 0,
      });
    }
    return rowCacheStore.get(stableSignature)!;
  };

  /**
   * Check if all requested rows are in the cache.
   * If yes, return the data from cache and seed React Query's cache.
   */
  const checkAndSeedCache = (
    targetOffset: number,
    targetLimit: number
  ): IResponseQuery | undefined => {
    const rowCache = getRowCache();
    const targetEnd = targetOffset + targetLimit - 1;

    // Check if all requested rows are cached
    const allRowsCached = Array.from(
      { length: targetLimit },
      (_, i) => targetOffset + i
    ).every((rowIndex) => rowCache.rows.has(rowIndex));

    if (!allRowsCached) {
      console.log(
        `❌ Cache miss: Need rows [${targetOffset}-${targetEnd}], have ${rowCache.rows.size} rows cached`
      );
      return undefined;
    }

    // All rows are cached - extract them
    const entities: IResponseQueryEntity[] = [];
    for (let i = 0; i < targetLimit; i++) {
      const rowIndex = targetOffset + i;
      const entity = rowCache.rows.get(rowIndex);
      if (entity) {
        entities.push(entity);
      }
    }

    const cachedData: IResponseQuery = {
      query: queryState,
      explore: exploreState,
      entities,
      total: rowCache.total,
    };

    console.log(
      `✅ Cache hit: All rows [${targetOffset}-${targetEnd}] found in cache (${rowCache.rows.size} total rows) - skip fetch`
    );

    return cachedData;
  };

  /**
   * Store fetched rows in the row cache
   */
  const storeFetchedRows = (
    offset: number,
    entities: IResponseQueryEntity[],
    total: number
  ) => {
    const rowCache = getRowCache();

    entities.forEach((entity, index) => {
      const rowIndex = offset + index;
      rowCache.rows.set(rowIndex, entity);
    });

    rowCache.total = total;

    console.log(
      `📦 Stored ${entities.length} rows [${offset}-${
        offset + entities.length - 1
      }] in cache. Total cached: ${rowCache.rows.size} rows`
    );
  };

  const {
    data,
    error: rqError,
    isFetching,
  } = useQuery({
    queryKey: [
      "query",
      stableSignature,
      { offset: exploreState.offset, limit: exploreState.limit },
    ],
    queryFn: async () => {
      // First check if we have all rows in our row cache
      const cachedData = checkAndSeedCache(
        exploreState.offset,
        exploreState.limit
      );
      if (cachedData) {
        // Return cached data immediately - no network fetch
        return cachedData;
      }

      // Cache miss - fetch from network
      console.log(
        "🔄 Fetching new window:",
        exploreState.offset,
        "-",
        exploreState.offset + exploreState.limit - 1
      );
      if (!queryStateValidity.isValid || !api.isLoggedIn()) return;
      const res = await api.query({
        query: queryState,
        explore: exploreState,
      });

      // Store fetched rows in our row cache
      if (res.data?.entities) {
        storeFetchedRows(
          exploreState.offset,
          res.data.entities,
          res.data.total
        );
      }

      return res.data;
    },
    // Never consider cached windows stale - keep them indefinitely per session
    staleTime: Infinity,
    // Keep in memory for 30 minutes after last access
    gcTime: 1000 * 60 * 30,
    enabled: queryStateValidity.isValid && api.isLoggedIn(),
  });

  // When signature changes (query/explore config changes), clear both caches
  const prevSignatureRef = useRef(stableSignature);
  useEffect(() => {
    if (prevSignatureRef.current !== stableSignature) {
      console.log(
        "🗑️ Query criteria changed - clearing all cached data for old signature:",
        prevSignatureRef.current
      );

      // Clear row cache
      rowCacheStore.delete(prevSignatureRef.current);

      // Clear React Query cache for old signature
      queryClient.removeQueries({
        queryKey: ["query", prevSignatureRef.current],
        exact: false,
      });

      prevSignatureRef.current = stableSignature;
    }
  }, [stableSignature, queryClient]);

  return {
    data,
    error: (rqError as Error) ?? null,
    isFetching,
  };
};
