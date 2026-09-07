// batch-fetch a set of entities by ids
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "api";

// The prefix keeps each caller's cache entries separate, so invalidating one
// feature's entities does not refetch the others.
export function useEntitiesQuery(
  queryKeyPrefix: string,
  entityIds: string[],
  options: {
    enabled?: boolean;
    staleTime?: number;
    /**
     * Serve the previous id set's entities while the new one loads. The id list
     * is part of the query key, so every change starts an uncached fetch -
     * callers that render a tag per id would otherwise flash placeholders for
     * ids they already had.
     */
    keepPrevious?: boolean;
  } = {},
) {
  const { enabled = true, staleTime, keepPrevious = false } = options;

  return useQuery({
    queryKey: [queryKeyPrefix, entityIds],
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    queryFn: async () => {
      const res = await api.entitiesGet(entityIds);
      return res.data ?? [];
    },
    enabled: api.isLoggedIn() && entityIds.length > 0 && enabled,
    staleTime,
  });
}
