/**
 * type of the /user endpoint response
 */

import { IResponseEntity } from ".";
import { EntityClass, EntityLogicalType } from "../enums";

// Deprecated
export interface IResponseSearchOld {
  class: EntityClass;
  entityId: string;
  entityLabel: string;
  logicalType?: EntityLogicalType;
}

export interface IResponseSearch extends IResponseEntity {
  // tbd
}
