import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IObject } from "@shared/types";

class ObjectData implements IModel {
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

class ObjectEntity extends Entity implements IObject {
  class: EntityEnums.Class.Object = EntityEnums.Class.Object; // just default
  data: ObjectData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new ObjectData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Object) {
      return false;
    }

    return this.data.isValid();
  }
}

export default ObjectEntity;
