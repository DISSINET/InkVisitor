/**
 * type of the /user endpoint response
 */

import { IActant, IAudit, IStatement, ITerritory } from ".";

// TODO
export interface IResponseActant extends IActant {
    usedIn: IStatement[]; // all statements where this actant is used
    usedCount: number; // how many times was this action used
    audits: IAudit[];
    displayLabel: string;
}
