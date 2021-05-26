/**
 * type of the GET /statement {id} and POST /statement {id[]} response
 */

import { IAudit, IActant, IStatement } from ".";

export interface IResponseStatement extends IStatement {
  actants: IActant[];
  audits?: IAudit[];
  usedIn?: IStatement[];
}
