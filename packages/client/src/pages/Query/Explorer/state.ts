import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Explore } from "@inkvisitor/shared/types/query";
import { IRequestSearchRootValidity } from "@inkvisitor/shared/types/request-search";

const exploreStateInitial: Explore.IExplore = {
  view: { mode: Explore.EViewMode.Table },
  columns:
    // only show in development mode
    process.env.NODE_ENV === "development"
      ? [
          // {
          //   id: "1",
          //   name: "Sex",
          //   type: Explore.EExploreColumnType.EPV,
          //   editable: true,
          //   params: {
          //     propertyType: "4ce5e669-d421-40c9-b1ce-f476fdd171fe",
          //   },
          // },
          ...RelationEnums.AllTypes.map((relationType, index) => ({
            id: String(index + 2),
            name: relationType,
            params: { relationType },
            editable: true,
            type: Explore.EExploreColumnType.ER,
          })),
        ]
      : [],
  sort: undefined,
  filters: [],
  limit: 1,
  offset: 0,
};

interface ExploreAction {
  type: ExploreActionType;
  payload?: any;
}
enum ExploreActionType {
  addColumn,
  removeColumn,
  setOffset,
  setLimit,
  setLimitAndOffset,
  sort,
  setLabelFilter,
  setUuidsFilter,
  setStatusFilter,
  setLanguageFilter,
  setCreatedAtFilter,
  setUpdatedAtFilter,
  setCreatedByFilter,
  setUpdatedByFilter,
  setEditedByFilter,
  setRootValidityFilter,
  clearFloatingSearchFilters,
}

const floatingSearchFilterTypes = new Set<Explore.SearchOption>([
  Explore.SearchOption.Status,
  Explore.SearchOption.Language,
  Explore.SearchOption.CreatedAt,
  Explore.SearchOption.UpdatedAt,
  Explore.SearchOption.CreatedBy,
  Explore.SearchOption.UpdatedBy,
  Explore.SearchOption.EditedBy,
  Explore.SearchOption.RootValidity,
]);

const exploreReducerBase = (state: Explore.IExplore, action: ExploreAction): Explore.IExplore => {
  switch (action.type) {
    case ExploreActionType.addColumn:
      const newColumn: Explore.IExploreColumn = action.payload;
      return {
        ...state,
        ...{ columns: [...state.columns, newColumn] },
      };

    case ExploreActionType.removeColumn:
      const removedColumnId = action.payload.id;
      return {
        ...state,
        ...{
          columns: state.columns.filter((column) => column.id !== removedColumnId),
        },
      };

    case ExploreActionType.setOffset:
      return {
        ...state,
        ...{
          offset: action.payload,
        },
      };

    case ExploreActionType.setLimit:
      return {
        ...state,
        ...{
          limit: action.payload,
        },
      };

    case ExploreActionType.setLimitAndOffset:
      return {
        ...state,
        ...{
          limit: action.payload.limit,
          offset: action.payload.offset,
        },
      };

    case ExploreActionType.sort:
      return {
        ...state,
        ...{
          sort: action.payload,
        },
      };

    case ExploreActionType.setLabelFilter: {
      const { label, useRegex } = action.payload as {
        label: string;
        useRegex?: boolean;
      };
      const trimmedLabel = label.trim();
      const existingLabelFilter = state.filters.find(
        (f): f is Explore.IExploreLabelFilter => f.type === Explore.SearchOption.Label,
      );
      const nextUseRegex = useRegex ?? existingLabelFilter?.useRegex ?? false;
      const otherFilters = state.filters.filter((f) => f.type !== Explore.SearchOption.Label);
      const filters: Explore.IExploreSearchFilter[] =
        trimmedLabel.length > 0
          ? [
              ...otherFilters,
              {
                type: Explore.SearchOption.Label,
                label: trimmedLabel,
                useRegex: nextUseRegex,
              },
            ]
          : otherFilters;

      return {
        ...state,
        filters,
        offset: 0,
      };
    }

    case ExploreActionType.setUuidsFilter: {
      const { ids } = action.payload as { ids: string[] };
      const otherFilters = state.filters.filter((f) => f.type !== Explore.SearchOption.UUIDs);
      const filters: Explore.IExploreSearchFilter[] =
        ids.length > 0
          ? [
              ...otherFilters,
              {
                type: Explore.SearchOption.UUIDs,
                ids,
              },
            ]
          : otherFilters;

      return {
        ...state,
        filters,
        offset: 0,
      };
    }

    case ExploreActionType.setStatusFilter: {
      const { status } = action.payload as { status?: EntityEnums.Status };
      const otherFilters = state.filters.filter((f) => f.type !== Explore.SearchOption.Status);
      const filters: Explore.IExploreSearchFilter[] =
        status !== undefined
          ? [...otherFilters, { type: Explore.SearchOption.Status, status }]
          : otherFilters;
      return {
        ...state,
        filters,
        offset: 0,
      };
    }

    case ExploreActionType.setLanguageFilter: {
      const { language } = action.payload as { language?: EntityEnums.Language };
      const otherFilters = state.filters.filter((f) => f.type !== Explore.SearchOption.Language);
      const filters: Explore.IExploreSearchFilter[] =
        language !== undefined
          ? [...otherFilters, { type: Explore.SearchOption.Language, language }]
          : otherFilters;
      return {
        ...state,
        filters,
        offset: 0,
      };
    }

    case ExploreActionType.setCreatedAtFilter: {
      const { createdDate } = action.payload as { createdDate?: Date };
      const otherFilters = state.filters.filter(
        (f) => f.type !== Explore.SearchOption.CreatedAt,
      );
      return {
        ...state,
        filters: createdDate
          ? [
              ...otherFilters,
              {
                type: Explore.SearchOption.CreatedAt,
                createdAt: createdDate.toISOString(),
              },
            ]
          : otherFilters,
        offset: 0,
      };
    }

    case ExploreActionType.setUpdatedAtFilter: {
      const { updatedDate } = action.payload as { updatedDate?: Date };
      const otherFilters = state.filters.filter(
        (f) => f.type !== Explore.SearchOption.UpdatedAt,
      );
      return {
        ...state,
        filters: updatedDate
          ? [
              ...otherFilters,
              {
                type: Explore.SearchOption.UpdatedAt,
                updatedAt: updatedDate.toISOString(),
              },
            ]
          : otherFilters,
        offset: 0,
      };
    }

    case ExploreActionType.setCreatedByFilter: {
      const { createdBy } = action.payload as { createdBy?: string };
      const otherFilters = state.filters.filter((f) => f.type !== Explore.SearchOption.CreatedBy);
      return {
        ...state,
        filters: createdBy
          ? [...otherFilters, { type: Explore.SearchOption.CreatedBy, createdBy }]
          : otherFilters,
        offset: 0,
      };
    }

    case ExploreActionType.setUpdatedByFilter: {
      const { updatedBy } = action.payload as { updatedBy?: string };
      const otherFilters = state.filters.filter((f) => f.type !== Explore.SearchOption.UpdatedBy);
      return {
        ...state,
        filters: updatedBy
          ? [...otherFilters, { type: Explore.SearchOption.UpdatedBy, updatedBy }]
          : otherFilters,
        offset: 0,
      };
    }

    case ExploreActionType.setEditedByFilter: {
      const { editedBy } = action.payload as { editedBy?: string };
      const otherFilters = state.filters.filter(
        (f) => f.type !== Explore.SearchOption.EditedBy,
      );
      return {
        ...state,
        filters: editedBy
          ? [...otherFilters, { type: Explore.SearchOption.EditedBy, editedBy }]
          : otherFilters,
        offset: 0,
      };
    }

    case ExploreActionType.setRootValidityFilter: {
      const { rootValidity } = action.payload as {
        rootValidity?: IRequestSearchRootValidity;
      };
      const otherFilters = state.filters.filter(
        (f) => f.type !== Explore.SearchOption.RootValidity,
      );
      return {
        ...state,
        filters:
          rootValidity && rootValidity !== IRequestSearchRootValidity.Any
            ? [
                ...otherFilters,
                { type: Explore.SearchOption.RootValidity, rootValidity },
              ]
            : otherFilters,
        offset: 0,
      };
    }

    case ExploreActionType.clearFloatingSearchFilters: {
      const filters = state.filters.filter((f) => !floatingSearchFilterTypes.has(f.type));
      if (filters.length === state.filters.length) {
        return state;
      }
      return {
        ...state,
        filters,
        offset: 0,
      };
    }

    default:
      return state;
  }
};

const exploreReducer = (state: Explore.IExplore, action: ExploreAction): Explore.IExplore => {
  const nextState = exploreReducerBase(state, action);

  // if (nextState !== state) {
  //   console.log("[exploreState]", {
  //     action: ExploreActionType[action.type],
  //     payload: action.payload,
  //     previous: state,
  //     next: nextState,
  //   });
  // }

  return nextState;
};

// TODO: implement a deep comparison
const exploreDiff = (state1: Explore.IExplore, state2: Explore.IExplore): boolean => {
  return JSON.stringify(state1) === JSON.stringify(state2);
};

export { ExploreAction, ExploreActionType, exploreDiff, exploreReducer, exploreStateInitial };
