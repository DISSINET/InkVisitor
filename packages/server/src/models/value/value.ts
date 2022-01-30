import Actant from "@models/actant/actant";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityClass, EntityLogicalType } from "@shared/enums";
import { IValue } from "@shared/types";

class ValueData implements IModel {
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

class Value extends Actant implements IValue {
  static table = "actants";
  static publicFields = Actant.publicFields;

  class: EntityClass.Value = EntityClass.Value; // just default
  data: ValueData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new ValueData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityClass.Value) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Value;
