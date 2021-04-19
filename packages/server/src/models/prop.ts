import { IProp } from "@shared/types";
import { fillFlatObject, UnknownObject } from "./common";

export class Prop implements IProp {
  id = "";
  elvl = "";
  certainty = "";
  modality = "";
  origin = "";

  type = {
    id: "",
    certainty: "",
    elvl: "",
  };
  value = {
    id: "",
    certainty: "",
    elvl: "",
  };

  constructor(data: UnknownObject) {
    fillFlatObject(this, data);

    if (typeof data.type === "object" && data.type !== null) {
      fillFlatObject(this.type, data.type as UnknownObject);
    }

    if (typeof data.value === "object" && data.value !== null) {
      fillFlatObject(this.value, data.value as UnknownObject);
    }
  }
}
