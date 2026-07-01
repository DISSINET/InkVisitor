import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useDetailQuery(entityId: string) {
  return useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      const res = await api.detailGet(entityId);
      return res.data;
    },
    enabled: !!entityId && api.isLoggedIn(),
    staleTime: 1 * 60 * 1000,
  });
}
