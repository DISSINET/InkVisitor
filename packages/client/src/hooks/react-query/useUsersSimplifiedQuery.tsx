import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useUsersSimplifiedQuery() {
  return useQuery({
    queryKey: ["users-simplified"],
    queryFn: async () => {
      const res = await api.usersGetSimplified();
      return res.data ?? [];
    },
    enabled: api.isLoggedIn(),
    staleTime: 5 * 60 * 1000,
  });
}
