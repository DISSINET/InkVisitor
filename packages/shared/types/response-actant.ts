/**
 * type of the /user endpoint response
 */

import { ActantI, AuditI, StatementI } from ".";

// TODO
export interface ResponseActantI extends ActantI {
    usedIn: StatementI[]; // all statements where this actoin was used
    usedCount: number; // how many times was this action used
    audits: AuditI[];
}
