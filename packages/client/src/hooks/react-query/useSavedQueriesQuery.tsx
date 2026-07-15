import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useSavedQueriesQuery(enabled = true) {
  return useQuery({
    queryKey: ["saved-queries"],
    queryFn: async () => {
      const res = await api.savedQueriesGet();
      return res.data.data ?? [];
    },
    enabled: api.isLoggedIn() && enabled,
    // shared queries by other users change rarely; own mutations invalidate
    // the key explicitly, so a short stale window avoids focus-refetch spam
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
