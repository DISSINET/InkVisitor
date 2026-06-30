import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useDocumentQuery(documentId?: string) {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      if (!documentId) {
        return undefined;
      }
      const res = await api.documentGet(documentId);
      return res.data ?? undefined;
    },
    enabled: !!documentId && api.isLoggedIn(),
  });
}
