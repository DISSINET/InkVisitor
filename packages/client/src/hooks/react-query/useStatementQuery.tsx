import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useStatementQuery(statementId: string) {
  return useQuery({
    queryKey: ["statement", statementId],
    queryFn: async () => {
      const res = await api.statementGet(statementId);
      return res.data;
    },
    enabled: !!statementId && api.isLoggedIn(),
    staleTime: 2 * 60 * 1000,
  });
}
