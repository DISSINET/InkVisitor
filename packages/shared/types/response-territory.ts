/**
 * type of the /territory endpoint response
 */

import { IActant, ITerritory, IStatement } from "./";

// to discuss
export interface IResponseTerritory extends ITerritory {
    statements: IStatement[]; // sorted statements with same territoryId
    actants: IActant[]; // all actants in the
}
