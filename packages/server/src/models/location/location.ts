import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityClass, EntityLogicalType } from "@shared/enums";
import { ILocation } from "@shared/types";

class LocationData implements IModel {
  logicalType: EntityLogicalType = EntityLogicalType.Definite;

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
  class: EntityClass.Location = EntityClass.Location; // just default
  data: LocationData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new LocationData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityClass.Location) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Location;
