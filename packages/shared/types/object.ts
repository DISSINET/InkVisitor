import { IEntity } from ".";
import { EntityClass, EntityLogicalType } from "../enums";

export interface IObject extends IEntity {
  class: EntityClass.Object;
  data: {
    logicalType: EntityLogicalType;
  };
}
