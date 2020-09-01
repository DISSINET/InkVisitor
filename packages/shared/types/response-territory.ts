/**
 * type of the /territory endpoint response
 */

import { ActantI, TerritoryI, StatementI, ActionI } from "./";

export interface ResponseTerritoryI extends TerritoryI {
  children: TerritoryI[];
  parent: false | TerritoryI;
  statements: StatementI[];
  actions: ActionI[];
  actants: ActantI[];
}
