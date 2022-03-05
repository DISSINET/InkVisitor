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
import {
  fillArray,
  fillFlatObject,
  IModel,
  UnknownObject,
} from "@models/common";

export class PropSpec implements IPropSpec, IModel {
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

export default class Prop implements IProp, IModel {
  id = "";
  elvl: Elvl = Elvl.Textual;
  certainty: Certainty = Certainty.Empty;
  logic: Logic = Logic.Positive;
  mood: Mood[] = [];
  moodvariant: MoodVariant = MoodVariant.Realis;
  bundleOperator: Operator = Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;

  children: Prop[] = [];

  type: PropSpec = new PropSpec({});
  value: PropSpec = new PropSpec({});

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    fillArray(this.mood, String, data.mood);

    this.type = new PropSpec(data.type);
    this.value = new PropSpec(data.value);

    fillArray<Prop>(this.children, Prop, data.children);
  }

  isValid(): boolean {
    return true; // always true - no rules yet
  }
}
