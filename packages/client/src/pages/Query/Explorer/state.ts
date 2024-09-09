import { Explore } from "@shared/types/query";

const exploreStateInitial: Explore.IExplore = {
  view: {},
  columns: [],
  sort: undefined,
  filters: [],
  limit: 100,
  offset: 0,
};

interface ExploreAction {
  type: ExploreActionType;
  payload: any;
}
enum ExploreActionType {
  addColumn,
  removeColumn,
}

const exploreReducer = (
  state: Explore.IExplore,
  action: ExploreAction
): Explore.IExplore => {
  switch (action.type) {
    case ExploreActionType.addColumn:
      return {
        ...state,
        columns: [...state.columns, action.payload],
      };

    case ExploreActionType.removeColumn:
      return {
        ...state,
        columns: state.columns.filter(
          (column) => column.id !== action.payload.id
        ),
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
