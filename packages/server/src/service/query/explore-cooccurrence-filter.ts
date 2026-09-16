import { Explore } from "@inkvisitor/shared/types/query";
import Statement from "@models/statement/statement";
import { Connection } from "rethinkdb-ts";

export const getCoOccurrenceFilter = (
  filters: Explore.IExploreSearchFilter[]
): Explore.IExploreCoOccurrenceFilter | undefined => {
  return filters.find(
    (f): f is Explore.IExploreCoOccurrenceFilter =>
      f.type === Explore.SearchOption.CoOccurrence
  );
};

/**
 * Keeps only the ids that share a statement with at least one of the filter's
 * entities (OR semantics). The co-occurrent set is resolved from the two
 * entity-keyed statement indexes in one query, so the cost follows the number of
 * statements the filter entities appear in, not the size of `items`.
 * Order of the input ids is preserved.
 */
export const applyCoOccurrenceFilter = async (
  db: Connection,
  items: string[],
  filter: Explore.IExploreCoOccurrenceFilter
): Promise<string[]> => {
  if (!filter.entityIds.length || !items.length) {
    return items;
  }

  const coOccurrentIds = new Set(
    await Statement.getCoOccurrentEntityIds(db, filter.entityIds)
  );

  return items.filter((id) => coOccurrentIds.has(id));
};
