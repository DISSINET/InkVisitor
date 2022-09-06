import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { ILocation, ILocationData } from "@shared/types";

class LocationData implements ILocationData, IModel {
  logicalType: EntityEnums.LogicalType = EntityEnums.LogicalType.Definite;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Location extends Entity implements ILocation {
  class: EntityEnums.Class.Location = EntityEnums.Class.Location; // just default
  data: LocationData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new LocationData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Location) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Location;
