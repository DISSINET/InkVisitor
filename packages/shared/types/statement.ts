import { IActant, IProp } from "./";
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
  data: IStatementData;
}

export interface IStatementData {
  text: string;
  territory?: {
    id: string;
    order: number;
  };
  actions: IStatementAction[];
  actants: IStatementActant[];
  references: IStatementReference[];
  tags: string[]; // ids of IActant;
}

export interface IStatementAction {
  id: string;
  action: string;
  elvl: Elvl;
  certainty: Certainty;
  logic: Logic;
  mood: Mood[];
  moodvariant: MoodVariant;
  bundleOperator: Operator;
  bundleStart: boolean;
  bundleEnd: boolean;
  props: IProp[];
}

export interface IStatementActant {
  id: string;
  actant: string;
  position: Position;
  elvl: Elvl;
  logic: Logic;
  virtuality: Virtuality;
  partitivity: Partitivity;
  bundleOperator: Operator;
  bundleStart: boolean;
  bundleEnd: boolean;
  props: IProp[];
}

export interface IStatementReference {
  id: string;
  resource: string;
  part: string;
  type: string;
}
