import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IGroup, IGroupData } from "@inkvisitor/shared/types";

class GroupData implements IGroupData, IModel {
  logicalType: EntityEnums.LogicalType = EntityEnums.LogicalType.Definite;

  constructor(data: Partial<IGroupData>) {
    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Group extends Entity implements IGroup {
  class: EntityEnums.Class.Group = EntityEnums.Class.Group; // just default
  data: GroupData;

  constructor(data: Partial<IGroup>) {
    super(data);
    this.data = new GroupData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Group) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Group;
