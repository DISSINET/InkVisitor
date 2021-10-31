/**
 * type of the GET /statement {id} and POST /statement {id[]} response
 */

import { IAudit, IActant, IStatement, IAction } from ".";
import { UserRoleMode } from "../enums";

export interface IResponseStatement extends IStatement {
  actants: IActant[];
  actions?: IAction[];
  audits?: IAudit[];
  usedIn?: IStatement[];
  right?: UserRoleMode;
}
