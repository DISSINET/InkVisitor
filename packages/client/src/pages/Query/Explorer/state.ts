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

const exploreReducer = (state: Explore.IExplore, action: ExploreAction) => {
  switch (action.type) {
    case ExploreActionType.addColumn:
      return state;
    case ExploreActionType.removeColumn:
      return state;
    default:
      return state;
  }
};

const exploreDiff = (state1: Explore.IExplore, state2: Explore.IExplore) => {
  return true;
};

export {
  ExploreAction,
  ExploreActionType,
  exploreDiff,
  exploreReducer,
  exploreStateInitial,
};
