import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useAuditQuery(entityId: string, enabled = true) {
  return useQuery({
    queryKey: ["audit", entityId],
    queryFn: async () => {
      const res = await api.auditGet(entityId);
      return res.data;
    },
    enabled: !!entityId && api.isLoggedIn() && enabled,
  });
}
