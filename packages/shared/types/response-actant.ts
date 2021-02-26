/**
 * type of the /user endpoint response
 */

import { IActant, IAudit, IStatement, ITerritory } from ".";

// TODO
export interface IResponseActant extends IActant {
    usedCount: number;
}
