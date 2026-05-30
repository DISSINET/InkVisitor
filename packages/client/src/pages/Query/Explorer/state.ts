import { EntityEnums } from "@inkvisitor/shared/enums";
import { Explore } from "@inkvisitor/shared/types/query";

const exploreStateInitial: Explore.IExplore = {
  view: { mode: Explore.EViewMode.Table },
  columns:
    // only show in development mode
    process.env.NODE_ENV === "development"
      ? [
          {
            id: "1",
            name: "Sex",
            type: Explore.EExploreColumnType.EPV,
            editable: true,
            params: {
              propertyType: "4ce5e669-d421-40c9-b1ce-f476fdd171fe",
            },
          },
          {
            id: "2",
            name: "Creator",
            type: Explore.EExploreColumnType.EUC,
            editable: false,
            params: {},
          },
          {
            id: "3",
            name: "Types",
            type: Explore.EExploreColumnType.EPT,
            editable: true,
            params: {},
          },
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
}

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
        (f): f is Explore.IExploreRowLabelFilter => f.type === Explore.SearchOption.Label,
      );
      const nextUseRegex = useRegex ?? existingLabelFilter?.useRegex ?? false;
      const otherFilters = state.filters.filter((f) => f.type !== Explore.SearchOption.Label);
      const filters: Explore.IExploreColumnFilter[] =
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
      const filters: Explore.IExploreColumnFilter[] =
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
      const { status } = action.payload as { status: EntityEnums.Status };
      const otherFilters = state.filters.filter((f) => f.type !== Explore.SearchOption.Status);
      return {
        ...state,
        filters: [...otherFilters, { type: Explore.SearchOption.Status, status }],
      };
    }

    default:
      return state;
  }
};

const exploreReducer = (state: Explore.IExplore, action: ExploreAction): Explore.IExplore => {
  const nextState = exploreReducerBase(state, action);

  if (nextState !== state) {
    console.log("[exploreState]", {
      action: ExploreActionType[action.type],
      payload: action.payload,
      previous: state,
      next: nextState,
    });
  }

  return nextState;
};

// TODO: implement a deep comparison
const exploreDiff = (state1: Explore.IExplore, state2: Explore.IExplore): boolean => {
  return JSON.stringify(state1) === JSON.stringify(state2);
};

export { ExploreAction, ExploreActionType, exploreDiff, exploreReducer, exploreStateInitial };
