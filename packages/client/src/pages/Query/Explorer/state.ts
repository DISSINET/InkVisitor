import { IEntity } from "@shared/types";
import { Explore } from "@shared/types/query";

const exploreStateInitial: Explore.IExplore = {
  view: { mode: Explore.EViewMode.Table },
  columns: [
    // {
    //   id: "sex_value",
    //   name: "Sex",
    //   type: Explore.EExploreColumnType.EPV,
    //   editable: true,
    //   params: {
    //     propertyType: "4ce5e669-d421-40c9-b1ce-f476fdd171fe",
    //   },
    // },
  ],
  sort: undefined,
  filters: [],
  limit: 20,
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
  sort,
}

const exploreReducer = (
  state: Explore.IExplore,
  action: ExploreAction
): Explore.IExplore => {
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
          columns: state.columns.filter(
            (column) => column.id !== removedColumnId
          ),
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

    case ExploreActionType.setLimit:
      return {
        ...state,
        ...{
          limit: action.payload,
        },
      };

    case ExploreActionType.sort:
      return {
        ...state,
        ...{
          sort: action.payload,
        },
      };

    default:
      return state;
  }
};

const exploreDiff = (
  state1: Explore.IExplore,
  state2: Explore.IExplore
): boolean => {
  return JSON.stringify(state1) !== JSON.stringify(state2);
};

export {
  ExploreAction,
  ExploreActionType,
  exploreDiff,
  exploreReducer,
  exploreStateInitial,
};
