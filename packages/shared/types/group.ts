import { IEntity } from ".";
import { EntityClass, EntityLogicalType } from "../enums";

export interface IGroup extends IEntity {
  class: EntityClass.Group;
  data: {
    logicalType: EntityLogicalType;
  };
}
