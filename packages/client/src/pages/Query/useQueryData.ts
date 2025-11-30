import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
  /** Direct lookup into row cache - use for rendering during scroll */
  getCachedEntity: (rowIndex: number) => IResponseQueryEntity | undefined;
}

interface RowCache {
  signature: string;
  rows: Map<number, IResponseQueryEntity>;
  total: number;
}

const rowCacheStore = new Map<string, RowCache>();

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
      });
    }
    return rowCacheStore.get(stableSignature)!;
  };

  const checkAndSeedCache = (
    targetOffset: number,
    targetLimit: number
  ): IResponseQuery | undefined => {
    const rowCache = getRowCache();
    const targetEnd = targetOffset + targetLimit - 1;

    const allRowsCached = Array.from(
      { length: targetLimit },
      (_, i) => targetOffset + i
    ).every((rowIndex) => rowCache.rows.has(rowIndex));

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

    console.log(
      `✅ Cache hit: rows [${targetOffset}-${targetEnd}] (${rowCache.rows.size} total cached)`
    );

    return {
      query: queryState,
      explore: exploreState,
      entities,
      total: rowCache.total,
    };
  };

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
  };

  const queryKey = useMemo(
    () => [
      "query",
      stableSignature,
      { offset: exploreState.offset, limit: exploreState.limit },
    ],
    [stableSignature, exploreState.offset, exploreState.limit]
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
      const cachedData = checkAndSeedCache(
        exploreState.offset,
        exploreState.limit
      );
      if (cachedData) {
        return cachedData;
      }

      console.log(
        `🔄 Fetching rows [${exploreState.offset}-${
          exploreState.offset + exploreState.limit - 1
        }]`
      );

      if (!queryStateValidity.isValid || !api.isLoggedIn()) return;
      const res = await api.query({
        query: queryState,
        explore: exploreState,
      });

      if (res.data?.entities) {
        storeFetchedRows(
          exploreState.offset,
          res.data.entities,
          res.data.total
        );
        console.log(
          `📦 Stored ${res.data.entities.length} rows [${exploreState.offset}-${
            exploreState.offset + res.data.entities.length - 1
          }]`
        );
      }

      return res.data;
    },
    initialData: getInitialData,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    enabled: queryStateValidity.isValid && api.isLoggedIn(),
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
    [stableSignature]
  );

  return {
    data,
    error: (rqError as Error) ?? null,
    isFetching,
    getCachedEntity,
  };
};
