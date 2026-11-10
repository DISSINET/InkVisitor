import { useQuery } from "@tanstack/react-query";
import api from "api";

// keyed under ["entity", entityId] so every write that refreshes the entity's detail refreshes
// its relations too
export function useUsedRelationsQuery(
  entityId: string,
  { enabled = true, staleTime }: { enabled?: boolean; staleTime?: number } = {}
) {
  return useQuery({
    queryKey: ["entity", entityId, "used-relations"],
    queryFn: async () => {
      const res = await api.entityUsedRelationsGet(entityId);
      return res.data;
    },
    enabled: enabled && !!entityId && api.isLoggedIn(),
    staleTime,
  });
}
