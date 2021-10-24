/**
 * type of the /user endpoint response
 */

import { IActant, IStatement } from ".";
import { UserRoleMode } from "../enums";

export interface IResponseActant extends IActant {
  usedCount?: number;
  usedIn?: IStatement[];
  right: UserRoleMode;
}
