import { EntityEnums } from "../enums";

export interface IProp {
  id: string;
  elvl: EntityEnums.Elvl;
  certainty: EntityEnums.Certainty;
  logic: EntityEnums.Logic;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant;
  bundleOperator: EntityEnums.Operator;
  bundleStart: boolean;
  bundleEnd: boolean;

  children: IProp[];

  type: IPropSpec;
  value: IPropSpec;
}

export interface IPropSpec {
  entityId: string;
  elvl: EntityEnums.Elvl;
  logic: EntityEnums.Logic;
  virtuality: EntityEnums.Virtuality;
  partitivity: EntityEnums.Partitivity;
}
