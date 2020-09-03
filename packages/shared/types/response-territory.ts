/**
 * type of the /territory endpoint response
 */

import { ActantI, TerritoryI, StatementI } from "./";

export interface ResponseTerritoryI extends TerritoryI {
  children: TerritoryI[];
  parent: false | TerritoryI;
  statements: StatementI[];
  actants: ActantI[];
}
