import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useAuditQuery(entityId: string, enabled = true, relationsLimit = 10) {
  return useQuery({
    queryKey: ["audit", entityId, relationsLimit],
    queryFn: async () => {
      const res = await api.auditGet(entityId, relationsLimit);
      return res.data;
    },
    enabled: !!entityId && api.isLoggedIn() && enabled,
  });
}
