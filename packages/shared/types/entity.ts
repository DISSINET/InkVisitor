import { IActant } from "./";
import { EntityActantType, EntityLogicalType } from "../enums";

export interface IEntity extends IActant {
  class: EntityActantType;
  data: {
    logicalType: EntityLogicalType;
  };
}
