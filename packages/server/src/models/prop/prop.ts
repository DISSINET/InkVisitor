import { EntityEnums } from "@shared/enums";
import { IProp } from "@shared/types";
import { IPropSpec } from "@shared/types/prop";
import {
  fillArray,
  fillFlatObject,
  IModel,
  UnknownObject,
} from "@models/common";

export class PropSpec implements IPropSpec, IModel {
  entityId: string = "";
  elvl: EntityEnums.Elvl = EntityEnums.Elvl.Textual;
  logic: EntityEnums.Logic = EntityEnums.Logic.Positive;
  virtuality: EntityEnums.Virtuality = EntityEnums.Virtuality.Reality;
  partitivity: EntityEnums.Partitivity = EntityEnums.Partitivity.Unison;

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
  elvl: EntityEnums.Elvl = EntityEnums.Elvl.Textual;
  certainty: EntityEnums.Certainty = EntityEnums.Certainty.Empty;
  logic: EntityEnums.Logic = EntityEnums.Logic.Positive;
  mood: EntityEnums.Mood[] = [];
  moodvariant: EntityEnums.MoodVariant = EntityEnums.MoodVariant.Realis;
  bundleOperator: EntityEnums.Operator = EntityEnums.Operator.And;
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
