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
import { IPropSpec } from "@shared/types/prop";
import { fillArray, fillFlatObject, IModel, UnknownObject } from "./common";

export class StatementPropSpec implements IPropSpec, IModel {
  id: string = "";
  elvl: Elvl = Elvl.Textual;
  logic: Logic = Logic.Positive;
  virtuality: Virtuality = Virtuality.Reality;
  partitivity: Partitivity = Partitivity.Unison;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true; // always true - no rules yet
  }
}

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

  type: StatementPropSpec = new StatementPropSpec({});
  value: StatementPropSpec = new StatementPropSpec({});

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    fillArray(this.mood, String, data.mood);

    this.type = new StatementPropSpec(data.type);
    this.value = new StatementPropSpec(data.value);

    fillArray<StatementProp>(this.children, StatementProp, data.children);
  }

  isValid(): boolean {
    return true; // always true - no rules yet
  }
}
