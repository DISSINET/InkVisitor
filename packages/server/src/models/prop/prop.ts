import { EntityEnums } from "@shared/enums";
import { IProp } from "@shared/types";
import { IPropSpec } from "@shared/types";
import { fillArray, fillFlatObject, IModel } from "@models/common";

export class PropSpec implements IPropSpec, IModel {
  entityId: string = "";
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
  bundleStart: boolean = false;
  bundleEnd: boolean = false;

  children: Prop[] = [];

  type: PropSpec;
  value: PropSpec;

  statementOrder?: number | false;

  constructor(data: Partial<IProp>) {
    fillFlatObject(this, data);
    this.type = new PropSpec(data.type || {});
    this.value = new PropSpec(data.value || {});
    this.mood = data.mood || [EntityEnums.Mood.Indication];
    this.statementOrder =
      data.statementOrder !== undefined ? data.statementOrder : false;

    fillArray<Prop>(this.children, Prop, data.children);
  }

  isValid(): boolean {
    return true; // always true - no rules yet
  }
}
