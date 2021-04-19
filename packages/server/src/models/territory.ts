import { ITerritory, IParentTerritory } from "@shared/types/territory";
import { fillFlatObject, UnknownObject, IModel } from "./common";

export class TerritoryParent implements IParentTerritory, IModel {
  id = "";
  order = -1;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data as Record<string, unknown>);
  }

  isValid(): boolean {
    if (this.id === "" || this.order === -1) {
      return false;
    }

    return true;
  }
}

export class TerritoryData implements IModel {
  parent: TerritoryParent | false = false;
  type = "";
  content = "";
  lang = "";

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    const parentData = data.parent;
    delete data.parent;
    fillFlatObject(this, data);
    if (parentData) {
      this.parent = new TerritoryParent(parentData as Record<string, unknown>);
    }
  }

  isValid(): boolean {
    if (this.parent) {
      return this.parent.isValid();
    }

    return true;
  }
}

class Territory implements ITerritory, IModel {
  id = "";
  class: "T" = "T";
  label = "";
  data = new TerritoryData({});

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.data = new TerritoryData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== "T") {
      return false;
    }

    return this.data.isValid();
  }
}

export default Territory;
