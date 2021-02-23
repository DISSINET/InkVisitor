/**
 * type of the /user endpoint response
 */

import { IAudit, IActant, IStatement } from ".";

export interface IResponseStatement extends IStatement {
    audits: IAudit[];
    usedIn: IStatement[];
    actants: IActant;
}
