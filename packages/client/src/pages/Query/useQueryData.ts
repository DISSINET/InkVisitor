import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { IResponseQuery, IResponseQueryEntity } from "@inkvisitor/shared/types";
import { Explore, Query } from "@inkvisitor/shared/types/query";
import api from "api";
import { QueryValidity } from "./types";
import { isQueryRequestEmpty } from "./Query/utils";

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
  /** Direct lookup into row cache - use for rendering during scroll */
  getCachedEntity: (rowIndex: number) => IResponseQueryEntity | undefined;
}

interface RowCache {
  signature: string;
  rows: Map<number, IResponseQueryEntity>;
  total: number;
  /** Full ordered ids for the query result (same length as total). */
  entityIds: string[];
}

const rowCacheStore = new Map<string, RowCache>();

/**
 * Clears the row cache store for all queries or a specific signature
 */
export const clearRowCache = (signature?: string) => {
  if (signature) {
    rowCacheStore.delete(signature);
  } else {
    rowCacheStore.clear();
  }
};

export const useQueryData = ({
  queryState,
  exploreState,
  stableSignature,
  queryStateValidity,
}: UseQueryDataParams): UseQueryDataReturn => {
  const queryClient = useQueryClient();

  const getRowCache = (): RowCache => {
    if (!rowCacheStore.has(stableSignature)) {
      rowCacheStore.set(stableSignature, {
        signature: stableSignature,
        rows: new Map(),
        total: 0,
        entityIds: [],
      });
    }
    return rowCacheStore.get(stableSignature)!;
  };

  const checkAndSeedCache = (
    targetOffset: number,
    targetLimit: number,
  ): IResponseQuery | undefined => {
    const rowCache = getRowCache();
    const targetEnd = targetOffset + targetLimit - 1;

    const allRowsCached = Array.from({ length: targetLimit }, (_, i) => targetOffset + i).every(
      (rowIndex) => rowCache.rows.has(rowIndex),
    );

    if (!allRowsCached) {
      return undefined;
    }

    const entities: IResponseQueryEntity[] = [];
    for (let i = 0; i < targetLimit; i++) {
      const rowIndex = targetOffset + i;
      const entity = rowCache.rows.get(rowIndex);
      if (entity) {
        entities.push(entity);
      }
    }

    // console.log(
    //   `✅ Cache hit: rows [${targetOffset}-${targetEnd}] (${rowCache.rows.size} total cached)`,
    // );

    return {
      query: queryState,
      explore: exploreState,
      entityIds: rowCache.entityIds ?? [],
      entities,
      total: rowCache.total,
    };
  };

  const storeFetchedRows = (
    offset: number,
    entities: IResponseQueryEntity[],
    total: number,
    entityIds: string[],
  ) => {
    const rowCache = getRowCache();

    entities.forEach((entity, index) => {
      const rowIndex = offset + index;
      rowCache.rows.set(rowIndex, entity);
    });

    rowCache.total = total;
    if (entityIds.length > 0) {
      rowCache.entityIds = entityIds;
    }
  };

  // Skip firing the query when nothing constrains the search - an empty request
  // would scan the whole database (and, in stats mode, aggregate audits over
  // everything). This guards the auto-fire on page load with the default root.
  const isRequestEmpty = useMemo(
    () => isQueryRequestEmpty(queryState, exploreState),
    [queryState, exploreState],
  );

  const queryKey = useMemo(
    () => ["query", stableSignature, { offset: exploreState.offset, limit: exploreState.limit }],
    [stableSignature, exploreState.offset, exploreState.limit],
  );

  const getInitialData = (): IResponseQuery | undefined => {
    return checkAndSeedCache(exploreState.offset, exploreState.limit);
  };

  const {
    data,
    error: rqError,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const cachedData = checkAndSeedCache(exploreState.offset, exploreState.limit);
      if (cachedData) {
        return cachedData;
      }

      // console.log(
      //   `🔄 Fetching rows [${exploreState.offset}-${exploreState.offset + exploreState.limit - 1}]`,
      // );

      if (!queryStateValidity.isValid || !api.isLoggedIn() || isRequestEmpty)
        return;
      const res = await api.query({
        query: queryState,
        explore: exploreState,
      });

      if (res.data?.entities) {
        storeFetchedRows(
          exploreState.offset,
          res.data.entities,
          res.data.total,
          res.data.entityIds ?? [],
        );
        // console.log(
        //   `📦 Stored ${res.data.entities.length} rows [${exploreState.offset}-${
        //     exploreState.offset + res.data.entities.length - 1
        //   }]`,
        // );
      }

      return res.data;
    },
    initialData: getInitialData,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    enabled: queryStateValidity.isValid && api.isLoggedIn() && !isRequestEmpty,
  });

  const prevSignatureRef = useRef(stableSignature);
  useEffect(() => {
    if (prevSignatureRef.current !== stableSignature) {
      rowCacheStore.delete(prevSignatureRef.current);
      queryClient.removeQueries({
        queryKey: ["query", prevSignatureRef.current],
        exact: false,
      });
      prevSignatureRef.current = stableSignature;
    }
  }, [stableSignature, queryClient]);

  const getCachedEntity = useCallback(
    (rowIndex: number): IResponseQueryEntity | undefined => {
      const rowCache = rowCacheStore.get(stableSignature);
      return rowCache?.rows.get(rowIndex);
    },
    [stableSignature],
  );

  return {
    data,
    error: (rqError as Error) ?? null,
    isFetching,
    getCachedEntity,
  };
};

/**
 * Clears all explorer row caches and refetches active query observers.
 * Call after entity updates from detail (or anywhere outside the explorer table)
 * so embedded IEntity copies in column cells stay in sync.
 */
export function invalidateAllExplorerQueries(queryClient: QueryClient): void {
  clearRowCache();
  void queryClient.invalidateQueries({
    queryKey: ["query"],
    exact: false,
    refetchType: "active",
  });
}

/**
 * Clears row cache and forces the explorer query for this signature to refetch.
 * Use `invalidateQueries` (not `removeQueries` + `refetchQueries`): after removal,
 * there is nothing left in the cache for `refetchQueries` to run, so the table
 * stays stale. Invalidation refetches active observers regardless of staleTime.
 */
export function invalidateExplorerQueryForSignature(
  queryClient: QueryClient,
  stableSignature: string,
): void {
  clearRowCache(stableSignature);
  void queryClient.invalidateQueries({
    queryKey: ["query", stableSignature],
    exact: false,
    refetchType: "active",
  });
}

export function useInvalidateExplorerQuery(stableSignature: string | undefined): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    if (!stableSignature) return;
    invalidateExplorerQueryForSignature(queryClient, stableSignature);
  }, [queryClient, stableSignature]);
}
