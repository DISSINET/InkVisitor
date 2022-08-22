import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IGroup extends IEntity {
  class: EntityEnums.Class.Group;
  data: {
    logicalType: EntityEnums.LogicalType;
  };
}
