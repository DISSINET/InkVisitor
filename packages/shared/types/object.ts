import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IObject extends IEntity {
  class: EntityEnums.Class.Object;
  data: IObjectData;
}

export interface IObjectData {
  logicalType: EntityEnums.LogicalType;
}