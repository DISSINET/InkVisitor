/**
 * type of the /user endpoint response
 */

import { EntityClass, EntityLogicalType } from "../enums";

export interface IResponseSearch {
  class: EntityClass;
  actantId: string;
  actantLabel: string;
  logicalType?: EntityLogicalType;
}
