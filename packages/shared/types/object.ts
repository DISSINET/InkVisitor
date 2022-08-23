import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IObject extends IEntity {
  class: EntityEnums.Class.Object;
  data: {
    logicalType: EntityEnums.LogicalType;
  };
}
