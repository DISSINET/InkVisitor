import { RequestSearch } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { IRequestSearch } from "@inkvisitor/shared/types/request-search";

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
