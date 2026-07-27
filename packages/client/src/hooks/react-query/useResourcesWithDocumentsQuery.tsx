import { IResponseEntity } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useResourcesWithDocumentsQuery(
  enabled = true,
  // true = refetch only if stale, "always" = refetch always
  refetchOnMount: boolean | "always" = true,
) {
  return useQuery({
    queryKey: ["resourcesWithDocuments"],
    queryFn: async () => {
      const res = await api.entitiesSearch({ resourceHasDocument: true });
      return (res.data ?? []) as IResponseEntity[];
    },
    enabled: api.isLoggedIn() && enabled,
    // stale time is 5 minutes because Rs with Documents are refetched on Documents page load
    // and click on the resource dropdown in Annotator header
    staleTime: 5 * 60 * 1000,
    refetchOnMount,
  });
}
