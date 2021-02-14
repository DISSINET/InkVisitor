/**
 * type of the /user endpoint response
 */

import { AuditI, TerritoryI, StatementI } from ".";

export interface ResponseStatementI extends StatementI {
    audits: AuditI[];
    usedIn: StatementI[];
}
