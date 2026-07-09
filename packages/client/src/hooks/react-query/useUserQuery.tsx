// manage user data for current user
import { useQuery } from "@tanstack/react-query";
import { getStoredUserId, getStoredUserRole, getStoredUsername } from "utils/userStorage";
import api from "api";

export function useUserQuery(enabled = true) {
  const userId = getStoredUserId();
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId as string);
      return res.data ?? undefined;
    },
    enabled: !!userId && api.isLoggedIn() && enabled,
    staleTime: 1 * 60 * 1000,
    // refetch is important for aquiring new rights for Resources (with documents)
    // assigned by admin / owner
    refetchOnWindowFocus: true,
  });
}
