import { IEntity } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";

export function useTemplatesQuery(enabled = true) {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await api.entitiesSearch({ onlyTemplates: true });
      const templates: IEntity[] = res.data ?? [];
      templates.sort((a: IEntity, b: IEntity) =>
        a.labels[0].toLocaleLowerCase() > b.labels[0].toLocaleLowerCase() ? 1 : -1,
      );
      return templates;
    },
    enabled: api.isLoggedIn() && enabled,
    // templaptes are refetched on apply template dropdown click
    // (has also refresh button when yet empty)
    staleTime: 2 * 60 * 1000,
  });
}
