import { IActant } from "./";
import { EntityClass, EntityLogicalType } from "../enums";

export interface IEntity extends IActant {
  class: EntityClass;
  data: {
    logicalType: EntityLogicalType;
  };
}
