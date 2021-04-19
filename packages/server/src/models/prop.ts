import { IProp } from "@shared/types";
import { fillFlatObject, UnknownObject, IModel } from "./common";

export class Prop implements IProp, IModel {
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
    if (!data) {
      return;
    }

    fillFlatObject(this, data);

    fillFlatObject(this.type, data.type as Record<string, unknown>);

    fillFlatObject(this.value, data.value as Record<string, unknown>);
  }

  isValid(): boolean {
    return true; // always true - no rules yet
  }
}
