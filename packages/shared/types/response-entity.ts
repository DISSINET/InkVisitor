/**
 * type of the /user endpoint response
 */

import { IEntity } from ".";
import { UserEnums } from "../enums";

export type IResponseEntity<T extends IEntity = IEntity> = {
  // usedCount?: number;
  // usedIn?: IStatement[];
  right?: UserEnums.RoleMode;
} & T;
