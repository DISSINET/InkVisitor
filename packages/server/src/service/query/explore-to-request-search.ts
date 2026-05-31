import { SearchQuery } from "@models/entity/response-search";
import { RequestSearch } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { IRequestSearch } from "@inkvisitor/shared/types/request-search";
import { Connection } from "rethinkdb-ts";

/**
 * Translates Explorer row filters into a RequestSearch for reuse by the existing
 * SearchQuery backend. Label, UUIDs and RootValidity are intentionally NOT mapped
 * here - they are handled by their own Explorer filter steps.
 * Returns null when no translatable filter carries a value.
 */
export const exploreFiltersToRequestSearch = (
  filters: Explore.IExploreSearchFilter[]
): RequestSearch | null => {
  const data: IRequestSearch = {};
  let hasAny = false;

  for (const filter of filters) {
    switch (filter.type) {
      case Explore.SearchOption.Status:
        data.status = filter.status;
        hasAny = true;
        break;
      case Explore.SearchOption.Language:
        data.language = filter.language;
        hasAny = true;
        break;
      case Explore.SearchOption.CreatedAt:
        if (filter.createdAt) {
          data.createdDate = new Date(filter.createdAt);
          hasAny = true;
        }
        break;
      case Explore.SearchOption.UpdatedAt:
        if (filter.updatedAt) {
          data.updatedDate = new Date(filter.updatedAt);
          hasAny = true;
        }
        break;
      case Explore.SearchOption.CreatedBy:
        if (filter.createdBy) {
          data.createdBy = filter.createdBy;
          hasAny = true;
        }
        break;
      case Explore.SearchOption.UpdatedBy:
        if (filter.updatedBy) {
          data.updatedBy = filter.updatedBy;
          hasAny = true;
        }
        break;
      case Explore.SearchOption.EditedBy:
        if (filter.editedBy) {
          data.editedBy = filter.editedBy;
          hasAny = true;
        }
        break;
      // Label, UUIDs, RootValidity handled by dedicated Explorer filter steps.
    }
  }

  return hasAny ? new RequestSearch(data) : null;
};

/**
 * Narrows candidate entity ids by the Explorer filters that map onto the existing
 * search backend (status, language, created/updated dates, created/updated/edited by).
 * Returns the input ids unchanged when no such filter is present.
 * Order of the input ids is preserved.
 */
export const applyRequestSearchFilters = async (
  db: Connection,
  ids: string[],
  filters: Explore.IExploreSearchFilter[]
): Promise<string[]> => {
  const req = exploreFiltersToRequestSearch(filters);
  if (!req || !ids.length) {
    return ids;
  }

  req.entityIds = [...ids];

  const query = new SearchQuery(db);
  await query.fromRequest(req);
  const entities = await query.do();

  const matched = new Set(entities.map((e) => e.id));
  return ids.filter((id) => matched.has(id));
};
