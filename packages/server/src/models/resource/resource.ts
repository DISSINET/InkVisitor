import { fillFlatObject, UnknownObject, IModel } from "@models/common";
import { EntityClass } from "@shared/enums";
import { IResource } from "@shared/types/resource";
import Entity from "@models/entity/entity";

class ResourceData implements IModel {
  link: string = "";

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

class Resource extends Entity implements IResource {
  static publicFields = Entity.publicFields;

  class: EntityClass.Resource = EntityClass.Resource;
  data: ResourceData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new ResourceData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityClass.Resource) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Resource;
