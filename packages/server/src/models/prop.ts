import {
  Certainty,
  Elvl,
  Logic,
  Mood,
  MoodVariant,
  Operator,
  Partitivity,
  Virtuality,
} from "@shared/enums";
import { IProp } from "@shared/types";
import { fillArray, fillFlatObject, IModel, UnknownObject } from "./common";

export class StatementProp implements IProp, IModel {
  id = "";
  elvl: Elvl = Elvl.Textual;
  certainty: Certainty = Certainty.Empty;
  logic: Logic = Logic.Positive;
  mood: Mood[] = [];
  moodvariant: MoodVariant = MoodVariant.Realis;
  operator: Operator = Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;

  children: StatementProp[] = [];

  type: {
    id: string;
    elvl: Elvl;
    logic: Logic;
    virtuality: Virtuality;
    partitivity: Partitivity;
  } = {
    id: "",
    elvl: Elvl.Textual,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  };

  value: {
    id: string;
    elvl: Elvl;
    logic: Logic;
    virtuality: Virtuality;
    partitivity: Partitivity;
  } = {
    id: "",
    elvl: Elvl.Textual,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  };

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);

    fillFlatObject(this.type, data.type as Record<string, unknown>);

    fillFlatObject(this.value, data.value as Record<string, unknown>);

    fillArray<StatementProp>(this.children, StatementProp, data.children);
  }

  isValid(): boolean {
    return true; // always true - no rules yet
  }
}
