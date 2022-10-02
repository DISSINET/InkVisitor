import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { ILocation, ILocationData } from "@shared/types";

class LocationData implements ILocationData, IModel {
  logicalType: EntityEnums.LogicalType = EntityEnums.LogicalType.Definite;

  constructor(data: Partial<ILocationData>) {
    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Location extends Entity implements ILocation {
  class: EntityEnums.Class.Location = EntityEnums.Class.Location; // just default
  data: LocationData;

  constructor(data: Partial<ILocation>) {
    super(data);
    this.data = new LocationData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Location) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Location;
