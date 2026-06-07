import { useQuery } from "@tanstack/react-query";
import api from "api";

interface UseUsersGetMoreQueryOptions {
  enabled?: boolean;
}

export function useUsersGetMoreQuery(options?: UseUsersGetMoreQueryOptions) {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.usersGetMore({});
      return res.data ?? [];
    },
    enabled: api.isLoggedIn() && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}
