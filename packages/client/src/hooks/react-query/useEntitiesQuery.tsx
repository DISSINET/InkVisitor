// batch-fetch a set of entities by ids
import { useQuery } from "@tanstack/react-query";
import api from "api";

// The prefix keeps each caller's cache entries separate, so invalidating one
// feature's entities does not refetch the others.
export function useEntitiesQuery(
  queryKeyPrefix: string,
  entityIds: string[],
  options: { enabled?: boolean; staleTime?: number } = {},
) {
  const { enabled = true, staleTime } = options;

  return useQuery({
    queryKey: [queryKeyPrefix, entityIds],
    queryFn: async () => {
      const res = await api.entitiesGet(entityIds);
      return res.data ?? [];
    },
    enabled: api.isLoggedIn() && entityIds.length > 0 && enabled,
    staleTime,
  });
}
