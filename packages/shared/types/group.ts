import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IGroup extends IEntity {
  class: EntityEnums.Class.Group;
  data: IGroupData;
}

export interface IGroupData {
  logicalType: EntityEnums.LogicalType;
}