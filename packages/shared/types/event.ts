import { IEntity } from ".";
import { EntityClass, EntityLogicalType } from "../enums";

export interface IEvent extends IEntity {
  class: EntityClass.Event;
  data: {
    logicalType: EntityLogicalType;
  };
}
