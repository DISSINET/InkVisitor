import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useTreeData() {
  return useQuery({
    queryKey: ["tree"],
    queryFn: async () => {
      const res = await api.treeGet();
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });
}
