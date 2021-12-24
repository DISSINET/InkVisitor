/**
 * type of the /user endpoint response
 */

import { ActantType, EntityLogicalType } from "../enums";

export interface IResponseSearch {
  class: ActantType;
  actantId: string;
  actantLabel: string;
  logicalType?: EntityLogicalType;
}
