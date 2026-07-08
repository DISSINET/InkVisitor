import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useTreeQuery() {
  return useQuery({
    queryKey: ["tree"],
    queryFn: async () => {
      const res = await api.treeGet();
      return res.data;
    },
    enabled: api.isLoggedIn(),
    // refreshes the tree data (including changes of rights from admin)
    refetchOnWindowFocus: true,
  });
}
