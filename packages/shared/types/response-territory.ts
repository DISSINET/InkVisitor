/**
 * type of the /territory endpoint response
 */

import { ActantI, TerritoryI, StatementI } from "./";

// to discuss
export interface ResponseTerritoryI extends TerritoryI {
    statements: StatementI[];
    actants: ActantI[];
}
