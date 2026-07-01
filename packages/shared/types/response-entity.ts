/**
 * type of the /user endpoint response
 */

import { IEntity } from ".";
import { UserEnums } from "../enums";

export interface IResponseEntity extends IEntity {
  // usedCount?: number;
  // usedIn?: IStatement[];
  right?: UserEnums.RoleMode;
  // set by search when the entity was surfaced via an expansion option rather
  // than matching the query directly (#2969): "include equivalents" (SYN/IDE/AEE)
  // or "include subordinates" (inverse SCL/SOE/HOL + child territories)
  isEquivalent?: boolean;
  isSubordinate?: boolean;
}
