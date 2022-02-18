import {
  Certainty,
  Elvl,
  Logic,
  Mood,
  MoodVariant,
  Operator,
  Partitivity,
  Virtuality,
} from "../enums";

export interface IProp {
  id: string;
  elvl: Elvl;
  certainty: Certainty;
  logic: Logic;
  mood: Mood[];
  moodvariant: MoodVariant;
  bundleOperator: Operator;
  bundleStart: boolean;
  bundleEnd: boolean;

  children: IProp[];

  type: IPropSpec;
  value: IPropSpec;
}

export interface IPropSpec {
  id: string;
  elvl: Elvl;
  logic: Logic;
  virtuality: Virtuality;
  partitivity: Partitivity;
}
