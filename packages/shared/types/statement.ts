import { IEntity, IProp } from "./";
import {
  EntityClass,
  Certainty,
  Elvl,
  Position,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
  Operator,
  Language,
} from "../enums";

export interface IStatement extends IEntity {
  id: string;
  class: EntityClass.Statement;
  label: string;
  detail: string;
  language: Language;
  props: IProp[];
  notes: string[];
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
  tags: string[]; // ids of IEntity;
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
