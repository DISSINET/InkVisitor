import { ITerritory, IParentTerritory } from "@shared/types/territory";
import { fillFlatObject, UnknownObject } from "./common";

export class TerritoryData {
  parent: IParentTerritory | false = false;
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
      this.parent = {
        id: "",
        order: 0,
      };
      fillFlatObject(this.parent, parentData as Record<string, unknown>);
    }
  }
}

class Territory implements ITerritory {
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
}

export default Territory;
