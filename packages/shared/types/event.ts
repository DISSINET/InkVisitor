import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IEvent extends IEntity {
  class: EntityEnums.Class.Event;
  data: {
    logicalType: EntityEnums.LogicalType;
  };
}
