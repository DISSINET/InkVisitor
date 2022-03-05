import { IEntity } from ".";
import { EntityClass, EntityLogicalType } from "../enums";

export interface IPerson extends IEntity {
  class: EntityClass.Person;
  data: {
    logicalType: EntityLogicalType;
  };
}
