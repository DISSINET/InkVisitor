import { ResponseTerritoryI } from "@shared/types/response-territory";
import { ResponseMetaI } from "@shared/types/response-meta";

export const FETCH_META = "FETCH_META";
export const FETCH_TERRITORY = "FETCH_TERRITORY";
export const SET_TREE_EXPAND = "SET_TREE_EXPAND";
export const SET_TREE_SELECT = "SET_TREE_SELECT";

export interface TerritoryAction {
  type: typeof FETCH_TERRITORY;
  payload: ResponseTerritoryI;
}
export interface MetaAction {
  type: typeof FETCH_META;
  payload: ResponseMetaI;
}
export interface ExpandTreeAction {
  type: typeof SET_TREE_EXPAND;
  expandedTreeId: string;
}
export interface SelectTreeAction {
  type: typeof SET_TREE_SELECT;
  selectedTreeId: string;
}
