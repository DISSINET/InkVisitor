/**
 * type of the /user endpoint response
 */

import { IEntity } from ".";
import { UserEnums } from "../enums";

export interface IResponseEntity extends IEntity {
  // usedCount?: number;
  // usedIn?: IStatement[];
  right?: UserEnums.RoleMode;
  // set by search when the entity was surfaced via the "include equivalents"
  // option (SYN/IDE/AEE) rather than matching the query directly (#2969)
  isEquivalent?: boolean;
}
