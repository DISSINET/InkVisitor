import { IEntity } from ".";
import { EntityClass, EntityLogicalType } from "../enums";

export interface IValue extends IEntity {
  class: EntityClass.Value;
  data: {
    logicalType: EntityLogicalType;
  };
}
