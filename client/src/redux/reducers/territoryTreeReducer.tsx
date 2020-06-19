import {
  SET_TREE_EXPAND,
  SET_TREE_SELECT,
  ExpandTreeAction,
  SelectTreeAction,
  FetchTerritoriesAction,
  FETCH_TERRITORIES,
} from "redux/types";

const territories = (
  state: object = {},
  action: FetchTerritoriesAction
): object => {
  switch (action.type) {
    case FETCH_TERRITORIES:
      return action.payload;
    default:
      return state;
  }
};
const expandTreeId = (state: string = "", action: ExpandTreeAction): string => {
  switch (action.type) {
    case SET_TREE_EXPAND:
      return action.expandTreeId;
    default:
      return state;
  }
};
const selectTreeId = (state: string = "", action: SelectTreeAction): string => {
  switch (action.type) {
    case SET_TREE_SELECT:
      return action.selectTreeId;
    default:
      return state;
  }
};

export { expandTreeId, selectTreeId, territories };
