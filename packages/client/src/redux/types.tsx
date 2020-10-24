import { ResponseTerritoryI } from "@shared/types/response-territory";
import { ResponseMetaI } from "@shared/types/response-meta";

export const FETCH_META = "FETCH_META";
export const FETCH_TERRITORY = "FETCH_TERRITORY";
export const SET_ACTIVE_STATEMENT_ID = "SET_ACTIVE_STATEMENT_ID";
export const SET_AUTH_TOKEN = "SET_AUTH_TOKEN";

export interface TerritoryAction {
  type: typeof FETCH_TERRITORY;
  payload: ResponseTerritoryI;
}
export interface MetaAction {
  type: typeof FETCH_META;
  payload: ResponseMetaI;
}
export interface ActiveStatementIdAction {
  type: typeof SET_ACTIVE_STATEMENT_ID;
  activeStatementId: string;
}
export interface AuthTokenAction {
  type: typeof SET_AUTH_TOKEN;
  token: string;
}
