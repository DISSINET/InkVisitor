import Actant from "@models/actant/actant";
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

class Location extends Actant implements ILocation {
  static table = "actants";
  static publicFields = Actant.publicFields;

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
