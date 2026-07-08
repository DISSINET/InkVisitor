// manage user data for current user
import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useUserQuery(enabled?: boolean) {
  const userId = localStorage.getItem("userid");
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId as string);
      return res.data ?? undefined;
    },
    enabled: !!userId && api.isLoggedIn() && enabled,
    // for the change of rights from admin, the user needs to refetch the user data to get the new rights
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000,
  });
}
