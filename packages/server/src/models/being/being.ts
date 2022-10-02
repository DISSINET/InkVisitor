import Entity from "@models/entity/entity";
import { fillFlatObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IBeing, IBeingData } from "@shared/types";

class BeingData implements IBeingData, IModel {
  logicalType: EntityEnums.LogicalType = EntityEnums.LogicalType.Definite;

  constructor(data: Partial<IBeingData>) {
    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Being extends Entity implements IBeing {
  class: EntityEnums.Class.Being = EntityEnums.Class.Being;
  data: BeingData;

  constructor(data: Partial<IBeing>) {
    super(data);
    this.data = new BeingData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Being) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Being;
