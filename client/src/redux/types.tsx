import { Statement } from "types";

export const FETCH_STATEMENTS = "FETCH_STATEMENTS";
export const FETCH_STATEMENT = "FETCH_STATEMENT";
export const FETCH_TERRITORIES = "FETCH_TERRITORIES";
export const SET_TREE_EXPAND = "SET_TREE_EXPAND";
export const SET_TREE_SELECT = "SET_TREE_SELECT";

export interface StatementAction {
  type: typeof FETCH_STATEMENT;
  payload: Statement;
}
export interface StatementsAction {
  type: typeof FETCH_STATEMENTS;
  payload: Statement[];
}
export interface ExpandTreeAction {
  type: typeof SET_TREE_EXPAND;
  expandTreeId: string;
}
export interface SelectTreeAction {
  type: typeof SET_TREE_SELECT;
  selectTreeId: string;
}
export interface FetchTerritoriesAction {
  type: typeof FETCH_TERRITORIES;
  payload: object;
}
