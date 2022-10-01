import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IBeing extends IEntity {
  class: EntityEnums.Class.Being;
  data: IBeingData;
}

export interface IBeingData {
  logicalType: EntityEnums.LogicalType;
}
