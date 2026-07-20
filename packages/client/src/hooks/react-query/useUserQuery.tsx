// manage user data for current user
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { getStoredUserId } from "utils/userStorage";

// fetch any user by id, shares cache with useUserQuery when the id matches the current user
export function useUserByIdQuery(
  userId: string | null | undefined,
  enabled = true,
  ignoreErrorToast = false,
) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId as string, { ignoreErrorToast });
      return res.data ?? undefined;
    },
    enabled: !!userId && api.isLoggedIn() && enabled,
    staleTime: 1 * 60 * 1000,
    // refetch is important for aquiring new rights for Resources (with documents)
    // assigned by admin / owner
    refetchOnWindowFocus: true,
  });
}

export function useUserQuery(enabled = true) {
  return useUserByIdQuery(getStoredUserId(), enabled);
}
