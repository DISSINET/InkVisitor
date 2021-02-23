/**
 * type of the /actions endpoint response
 */

import { IAction, IStatement } from ".";

export interface IResponseAction extends IAction {
    usedIn: IStatement[]; // last 10 statements where this actoin was used
    usedCount: number; // how many times was this action used
}
