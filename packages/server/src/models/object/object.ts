import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IObject, IObjectData } from "@shared/types";

class ObjectData implements IObjectData, IModel {
  logicalType: EntityEnums.LogicalType = EntityEnums.LogicalType.Definite;

  constructor(data: Partial<IObjectData>) {
    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class ObjectEntity extends Entity implements IObject {
  class: EntityEnums.Class.Object = EntityEnums.Class.Object; // just default
  data: ObjectData;

  constructor(data: Partial<IObject>) {
    super(data);
    this.data = new ObjectData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Object) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default ObjectEntity;
