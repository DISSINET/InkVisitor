/**
 * type of the /user endpoint response
 */

import { IEntity } from ".";
import { UserEnums } from "../enums";

export interface IResponseEntity extends IEntity {
  // usedCount?: number;
  // usedIn?: IStatement[];
  right?: UserEnums.RoleMode;
}
