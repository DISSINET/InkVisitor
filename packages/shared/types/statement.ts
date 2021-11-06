import { IActant } from "./";
import {
  ActantType,
  Certainty,
  Elvl,
  Position,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
  Operator,
} from "../enums";

export interface IStatement extends IActant {
  class: ActantType.Statement;
  data: {
    text: string;
    territory: {
      id: string;
      order: number;
    };
    actions: IStatementAction[];
    actants: IStatementActant[];
    props: IStatementProp[];
    references: IStatementReference[];
    tags: string[]; // ids of IActant;
  };
}

export interface IStatementAction {
  id: string;
  action: string;
  elvl: Elvl;
  certainty: Certainty;
  logic: Logic;
  mood: Mood[];
  moodvariant: MoodVariant;
  operator: Operator;
  bundleStart: boolean;
  bundleEnd: boolean;
}

export interface IStatementActant {
  id: string;
  actant: string;
  position: Position;
  elvl: Elvl;
  logic: Logic;
  virtuality: Virtuality;
  partitivity: Partitivity;
  operator: Operator;
  bundleStart: boolean;
  bundleEnd: boolean;
}

export interface IStatementProp {
  id: string;
  elvl: Elvl;
  certainty: Certainty;
  logic: Logic;
  mood: Mood[];
  moodvariant: MoodVariant;
  operator: Operator;
  bundleStart: boolean;
  bundleEnd: boolean;

  origin: string;
  // todo: make mandatory
  type: {
    id: string;
    elvl: Elvl;
    logic: Logic;
    virtuality: Virtuality;
    partitivity: Partitivity;
  };
  value: {
    id: string;
    elvl: Elvl;
    logic: Logic;
    virtuality: Virtuality;
    partitivity: Partitivity;
  };
}

export interface IStatementReference {
  id: string;
  resource: string;
  part: string;
  type: string;
}
