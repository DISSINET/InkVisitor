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

  // DB ids are lowercase, but user-pasted filter ids may be mixed/upper case.
  // Match case-insensitively so the intersection isn't silently emptied.
  const allowed = new Set(filter.ids.map((id) => id.toLowerCase()));
  return items.filter((id) => allowed.has(id.toLowerCase()));
};
