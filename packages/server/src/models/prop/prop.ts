import { EntityEnums } from "@shared/enums";
import { IProp } from "@shared/types";
import { IPropSpec } from "@shared/types";
import { fillArray, fillFlatObject, IModel } from "@models/common";
import { randomUUID } from "crypto";

export class PropSpec implements IPropSpec, IModel {
  entityId = "";
  elvl: EntityEnums.Elvl = EntityEnums.Elvl.Textual;
  logic: EntityEnums.Logic = EntityEnums.Logic.Positive;
  virtuality: EntityEnums.Virtuality = EntityEnums.Virtuality.Reality;
  partitivity: EntityEnums.Partitivity = EntityEnums.Partitivity.Unison;

  constructor(data: Partial<IPropSpec>) {
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
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant = EntityEnums.MoodVariant.Realis;
  bundleOperator: EntityEnums.Operator = EntityEnums.Operator.And;
  bundleStart = false;
  bundleEnd = false;

  children: Prop[] = [];

  type: PropSpec;
  value: PropSpec;

  constructor(data: Partial<IProp>) {
    fillFlatObject(this, data);
    this.type = new PropSpec(data.type || {});
    this.value = new PropSpec(data.value || {});
    this.mood = data.mood || [EntityEnums.Mood.Indication];
    fillArray<Prop>(this.children, Prop, data.children);
  }

  isValid(): boolean {
    return true; // always true - no rules yet
  }

  /**
   * Resets IDs of nested objects
   */
  resetIds() {
    this.id = randomUUID();
    if (this.children && this.children.length) {
      this.children.forEach((p) => p.resetIds());
    }
  }
}
