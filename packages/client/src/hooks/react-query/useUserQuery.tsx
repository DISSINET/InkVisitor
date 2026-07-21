// manage user data for current user
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { getStoredUserId } from "utils/userStorage";

// fetch any user by id, shares cache with useUserQuery when the id matches the current user
// the shared cache entry means only one queryFn survives per id, so the toast behaviour
// is fixed here rather than passed in by the caller
export function useUserByIdQuery(userId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId as string, {
        // typically used in batch in tables like audit so ignore error toast avoids spamming
        ignoreErrorToast: true,
      });
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
