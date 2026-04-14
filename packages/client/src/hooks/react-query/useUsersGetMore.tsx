import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useUsersGetMore() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.usersGetMore({});
      return res.data ?? [];
    },
    enabled: api.isLoggedIn(),
  });
}
