/**
 * type of the /territory endpoint response
 */

import { Actant, Territory, Statement, Action } from "./";
export interface ResponseTerritory extends Territory {
  children: Territory[];
  parent: false | Territory;
  statements: Statement[];
  actions: Action[];
  actants: Actant[];
}
