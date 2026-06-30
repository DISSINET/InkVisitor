import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useBookmarksQuery(enabled = true) {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const res = await api.bookmarksGet("me");
      const data = res.data ?? [];
      data.sort((a, b) => (a.name > b.name ? 1 : -1));
      return data;
    },
    enabled: api.isLoggedIn() && enabled,
  });
}
