import { EntityEnums } from "../enums";

export enum PropSpecKind {
  TypeKind = "type",
  ValueKind = "value",
}

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

export enum PropSpecKind {
  TYPE = "type",
  VALUE = "value",
}

export interface IPropSpec {
  entityId: string;
  elvl: EntityEnums.Elvl;
  logic: EntityEnums.Logic;
  virtuality: EntityEnums.Virtuality;
  partitivity: EntityEnums.Partitivity;
}
