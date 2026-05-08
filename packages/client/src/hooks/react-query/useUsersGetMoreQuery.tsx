import { useQuery } from "@tanstack/react-query";
import api from "api";

interface UseUsersGetMoreQueryOptions {
  enabled?: boolean;
}

export function useUsersGetMoreQuery(options?: UseUsersGetMoreQueryOptions) {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // TODO: make basic (only id and name) optional
      // currently it's not necessary to have all user info in used requests
      const res = await api.usersGetMore({ basic: true });
      return res.data ?? [];
    },
    enabled: api.isLoggedIn() && (options?.enabled ?? true),
  });
}
