import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useDetailQuery(
  entityId: string,
  { enabled = true, staleTime }: { enabled?: boolean; staleTime?: number } = {},
) {
  return useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      const res = await api.detailGet(entityId);
      return res.data;
    },
    enabled: enabled && !!entityId && api.isLoggedIn(),
    staleTime,
  });
}
