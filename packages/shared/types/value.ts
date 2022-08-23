import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IValue extends IEntity {
  class: EntityEnums.Class.Value;
  data: {
    logicalType: EntityEnums.LogicalType;
  };
}
