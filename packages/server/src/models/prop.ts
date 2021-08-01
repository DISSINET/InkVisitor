import { IProp } from "@shared/types";
import { fillFlatObject, UnknownObject, IModel } from "./common";
import {
  ActantType,
  ActantStatus,
  ActantLogicalType,
  StatementCertainty,
  StatementElvl,
  StatementPosition,
} from "@shared/enums";

export class Prop implements IProp, IModel {
  id = "";
  elvl: StatementElvl = "1";
  certainty: StatementCertainty = "1";
  modality = "";
  origin = "";

  type: {
    id: string;
    certainty: StatementCertainty;
    elvl: StatementElvl;
  } = {
    id: "",
    certainty: "1",
    elvl: "1",
  };
  value: {
    id: string;
    certainty: StatementCertainty;
    elvl: StatementElvl;
  } = {
    id: "",
    certainty: "1",
    elvl: "1",
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
