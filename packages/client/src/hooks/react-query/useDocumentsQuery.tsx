import { IDocument } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useDocumentsQuery(enabled = true, refetchOnMount: boolean | "always" = true) {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.documentsGet({});
      return (res.data ?? []) as IDocument[];
    },
    enabled: api.isLoggedIn() && enabled,
    // stale time is 5 minutes because documents are refetched on Documents page load
    // and click on the document dropdown in Resource detail
    staleTime: 5 * 60 * 1000,
    refetchOnMount,
  });
}
