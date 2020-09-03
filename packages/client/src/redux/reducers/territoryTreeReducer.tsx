import {
  SET_TREE_EXPAND,
  SET_TREE_SELECT,
  ExpandTreeAction,
  SelectTreeAction,
  FETCH_TERRITORY,
  TerritoryAction,
} from "redux/types";
import { ResponseTerritoryI } from "@shared/types/response-territory";

const initialState: ResponseTerritoryI = {
  class: "T",
  id: "",
  label: "",
  data: {
    content: "",
    language: "",
    parent: "",
    type: "",
  },
  children: [],
  parent: false,
  statements: [],
  actants: [],
};
const territory = (
  state: ResponseTerritoryI = initialState,
  action: TerritoryAction
): ResponseTerritoryI => {
  switch (action.type) {
    case FETCH_TERRITORY:
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

export { expandedTreeId, selectedTreeId, territory };
