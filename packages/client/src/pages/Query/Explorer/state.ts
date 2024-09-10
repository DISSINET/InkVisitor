import { IResponseQueryEntity } from "@shared/types";
import { Explore } from "@shared/types/query";

export interface ExploreState {
  entities: IResponseQueryEntity[];
  explore: Explore.IExplore;
}
const exploreStateInitial: ExploreState = {
  entities: [],
  explore: {
    view: {
      showNewColumn: true,
    },
    columns: [],
    sort: undefined,
    filters: [],
    limit: 100,
    offset: 0,
  },
};

interface ExploreAction {
  type: ExploreActionType;
  payload?: any;
}
enum ExploreActionType {
  addColumn,
  removeColumn,
  showNewColumn,
  hideNewColumn,
  setEntities,
}

const exploreReducer = (
  state: ExploreState,
  action: ExploreAction
): ExploreState => {
  switch (action.type) {
    case ExploreActionType.addColumn:
      return {
        ...state,
        explore: {
          ...state.explore,
          columns: [...state.explore.columns, action.payload],
        },
      };

    case ExploreActionType.removeColumn:
      return {
        ...state,
        explore: {
          ...state.explore,
          columns: state.explore.columns.filter(
            (column) => column.id !== action.payload.id
          ),
        },
      };

    case ExploreActionType.showNewColumn:
      return {
        ...state,
        explore: {
          ...state.explore,
          view: {
            ...state.explore.view,
            showNewColumn: true,
          },
        },
      };

    case ExploreActionType.hideNewColumn:
      return {
        ...state,
        explore: {
          ...state.explore,
          view: {
            ...state.explore.view,
            showNewColumn: false,
          },
        },
      };

    case ExploreActionType.setEntities:
      return {
        ...state,
        entities: action.payload,
      };

    default:
      return state;
  }
};

const exploreDiff = (state1: ExploreState, state2: ExploreState): boolean => {
  return JSON.stringify(state1) !== JSON.stringify(state2);
};

export {
  ExploreAction,
  ExploreActionType,
  exploreDiff,
  exploreReducer,
  exploreStateInitial,
};
