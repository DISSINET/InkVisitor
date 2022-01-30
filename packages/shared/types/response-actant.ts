/**
 * type of the /user endpoint response
 */

import { IEntity, IStatement } from ".";
import { UserRoleMode } from "../enums";

export interface IResponseActant extends IEntity {
  // usedCount?: number;
  // usedIn?: IStatement[];
  right?: UserRoleMode;
}
