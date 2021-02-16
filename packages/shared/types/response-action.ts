/**
 * type of the /actions endpoint response
 */

import { ActionI, StatementI } from ".";

export interface ResponseActionI extends ActionI {
    usedIn: StatementI[]; // last 10 statements where this actoin was used
    usedCount: number; // how many times was this action used
}
