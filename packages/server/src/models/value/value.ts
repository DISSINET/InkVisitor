import Entity from "@models/entity/entity";
import { fillFlatObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IValue, IValueData } from "@shared/types";

class ValueData implements IValueData, IModel {
  logicalType: EntityEnums.LogicalType;

  constructor(data: Partial<IValueData>) {
    this.logicalType = data.logicalType as EntityEnums.LogicalType
  }

  isValid(): boolean {
    return true;
  }
}

class Value extends Entity implements IValue {
  class: EntityEnums.Class.Value = EntityEnums.Class.Value; // just default
  data: ValueData;

  constructor(data: Partial<IValue>) {
    super(data);
    this.data = new ValueData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Value) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Value;
