import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityClass, EntityLogicalType } from "@shared/enums";
import { IGroup } from "@shared/types";

class GroupData implements IModel {
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

class Group extends Entity implements IGroup {
  class: EntityClass.Group = EntityClass.Group; // just default
  data: GroupData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new GroupData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityClass.Group) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Group;
