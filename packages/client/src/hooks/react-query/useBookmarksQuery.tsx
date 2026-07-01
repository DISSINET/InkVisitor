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
    // no need to fetch from other users, could be even infinity
    // (this stale time only counts on having app opened in two browsers
    // or switching to different computer without app reload)
    staleTime: 60 * 60 * 1000,
  });
}
