/**
 * type of the /territory endpoint response
 */

import { ActantI, TerritoryI, StatementI } from "./";

// to discuss
export interface ResponseTerritoryI extends TerritoryI {
    parents: ParentTerritoryI[];
    children: TerritoryI[];
    statementIds: string[];
}

interface ParentTerritoryI {
    level: number;
    territory: TerritoryI;
}
