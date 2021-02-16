/**
 * type of the /user endpoint response
 */

import { AuditI, ActantI, StatementI } from ".";

export interface ResponseStatementI extends StatementI {
    audits: AuditI[];
    usedIn: StatementI[];
    actants: ActantI;
}
