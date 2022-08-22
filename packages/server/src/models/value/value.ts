import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IValue } from "@shared/types";

class ValueData implements IModel {
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

class Value extends Entity implements IValue {
  class: EntityEnums.Class.Value = EntityEnums.Class.Value; // just default
  data: ValueData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new ValueData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Value) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Value;
