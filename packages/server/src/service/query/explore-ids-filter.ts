import { Explore } from "@inkvisitor/shared/types/query";

export const getRowIdsFilter = (
  filters: Explore.IExploreColumnFilter[]
): Explore.IExploreRowIdsFilter | undefined => {
  return filters.find(
    (f): f is Explore.IExploreRowIdsFilter => f.type === Explore.EExploreFilterType.RowIds
  );
};

export const applyRowIdsFilter = (
  items: string[],
  filter: Explore.IExploreRowIdsFilter
): string[] => {
  if (!filter.ids.length) {
    return items;
  }

  const allowed = new Set(filter.ids);
  return items.filter((id) => allowed.has(id));
};
