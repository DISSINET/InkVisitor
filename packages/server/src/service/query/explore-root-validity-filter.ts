import Entity from "@models/entity/entity";
import { ResponseSearch } from "@models/entity/response-search";
import { Setting } from "@models/setting/setting";
import { Explore } from "@inkvisitor/shared/types/query";
import { IRequestSearchRootValidity } from "@inkvisitor/shared/types/request-search";
import { Connection } from "rethinkdb-ts";

type RootValidityFilter = Extract<
  Explore.IExploreSearchFilter,
  { type: Explore.SearchOption.RootValidity }
>;

export const getRootValidityFilter = (
  filters: Explore.IExploreSearchFilter[]
): RootValidityFilter | undefined =>
  filters.find(
    (f): f is RootValidityFilter => f.type === Explore.SearchOption.RootValidity
  );

/**
 * Narrows candidate entity ids by root-territory validity. Returns the input ids
 * unchanged unless the filter requests Valid or Invalid. Order is preserved.
 */
export const applyRootValidityFilter = async (
  db: Connection,
  ids: string[],
  filter: RootValidityFilter
): Promise<string[]> => {
  const validity = filter.rootValidity;
  if (
    !ids.length ||
    (validity !== IRequestSearchRootValidity.Valid &&
      validity !== IRequestSearchRootValidity.Invalid)
  ) {
    return ids;
  }

  const entities = await Entity.findEntitiesByIds(db, ids);
  const settings = await Setting.getSettingsAll(db);
  const matched = await ResponseSearch.filterEntitiesByRootValidity(
    db,
    entities,
    validity,
    settings
  );

  const matchedSet = new Set(matched.map((e) => e.id));
  return ids.filter((id) => matchedSet.has(id));
};
