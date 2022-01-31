/**
 * type of the /user endpoint response
 */

import { EntityClass, EntityLogicalType } from "../enums";

export interface IResponseSearch {
  class: EntityClass;
  entityId: string;
  entityLabel: string;
  logicalType?: EntityLogicalType;
}
