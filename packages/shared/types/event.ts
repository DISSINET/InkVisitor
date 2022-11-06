import { IEntity } from ".";
import { EntityEnums } from "../enums";

export interface IEvent extends IEntity {
  class: EntityEnums.Class.Event;
  data: IEventData;
}

export interface IEventData {
  logicalType: EntityEnums.LogicalType;

}
