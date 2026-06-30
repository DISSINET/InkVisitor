import { IResponseEntity } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useResourcesWithDocumentsQuery(enabled = true) {
  return useQuery({
    queryKey: ["resourcesWithDocuments"],
    queryFn: async () => {
      const res = await api.entitiesSearch({ resourceHasDocument: true });
      return (res.data ?? []) as IResponseEntity[];
    },
    enabled: api.isLoggedIn() && enabled,
  });
}
