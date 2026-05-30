import { Explore } from "@inkvisitor/shared/types/query";

export const getRowIdsFilter = (
  filters: Explore.IExploreSearchFilter[]
): Explore.IExploreUuidsFilter | undefined => {
  return filters.find(
    (f): f is Explore.IExploreUuidsFilter => f.type === Explore.SearchOption.UUIDs
  );
};

export const applyRowIdsFilter = (
  items: string[],
  filter: Explore.IExploreUuidsFilter
): string[] => {
  if (!filter.ids.length) {
    return items;
  }

  const allowed = new Set(filter.ids);
  return items.filter((id) => allowed.has(id));
};
