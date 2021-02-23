/**
 * type of the /territory endpoint response
 */

import { IActant, ITerritory, IStatement } from "./";

// to discuss
export interface IResponseTerritory extends ITerritory {
    statements: IStatement[];
    actants: IActant[];
}
