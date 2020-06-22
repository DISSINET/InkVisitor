import {
  SET_TREE_EXPAND,
  SET_TREE_SELECT,
  ExpandTreeAction,
  SelectTreeAction,
  FetchTerritoriesAction,
  FETCH_TERRITORIES,
} from "redux/types";
import { Node } from "types";

const territories = (
  state: Node = { id: "", label: "", children: [] },
  action: FetchTerritoriesAction
): Node => {
  switch (action.type) {
    case FETCH_TERRITORIES:
      return action.payload;
    default:
      return state;
  }
};
const expandedTreeId = (
  state: string = "",
  action: ExpandTreeAction
): string => {
  switch (action.type) {
    case SET_TREE_EXPAND:
      return action.expandedTreeId;
    default:
      return state;
  }
};
const selectedTreeId = (
  state: string = "",
  action: SelectTreeAction
): string => {
  switch (action.type) {
    case SET_TREE_SELECT:
      return action.selectedTreeId;
    default:
      return state;
  }
};

export { expandedTreeId, selectedTreeId, territories };
