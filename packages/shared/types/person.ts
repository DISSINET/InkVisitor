import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IPerson extends IEntity {
  class: EntityEnums.Class.Person;
  data: IPersonData;
}

export interface IPersonData {
  logicalType: EntityEnums.LogicalType;
}