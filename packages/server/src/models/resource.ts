import { fillFlatObject, UnknownObject, IModel } from "./common";
import { ActantType, ActantStatus } from "@shared/enums";
import { IResource } from "@shared/types/resource";
import Actant from "./actant";

class ResourceData implements IModel {
  content = "";
  link = "";
  type = "";

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

class Resource extends Actant implements IResource {
  static table = "actants";

  id = "";
  class: ActantType.Resource = ActantType.Resource;
  data = new ResourceData({});
  label: string = "";
  detail: string = "";
  status: ActantStatus = ActantStatus["Approved"];
  language: string[] = ["eng"];
  notes: string[] = [];

  constructor(data: UnknownObject) {
    super();

    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.data = new ResourceData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== ActantType.Resource) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Resource;
