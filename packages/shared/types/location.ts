import { IEntity } from ".";
import { EntityClass, EntityLogicalType } from "../enums";

export interface ILocation extends IEntity {
  class: EntityClass.Location;
  data: {
    logicalType: EntityLogicalType;
  };
}
