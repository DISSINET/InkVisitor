import { fillFlatObject, UnknownObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IResource, IResourceData } from "@shared/types/resource";
import Entity from "@models/entity/entity";

class ResourceData implements IResourceData, IModel {
  url: string = "";
  partValueLabel: string = "";
  partValueBaseURL: string = "";

  constructor(data: Partial<IResourceData>) {
    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Resource extends Entity implements IResource {
  class: EntityEnums.Class.Resource = EntityEnums.Class.Resource;
  data: ResourceData;

  constructor(data: Partial<IResource>) {
    super(data);
    this.data = new ResourceData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Resource) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Resource;
