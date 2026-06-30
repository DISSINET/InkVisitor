import { IDocument } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useDocumentsQuery(enabled = true) {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.documentsGet({});
      return (res.data ?? []) as IDocument[];
    },
    enabled: api.isLoggedIn() && enabled,
  });
}
