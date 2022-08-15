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
    territoryId: string;
    order: number;
  };
  actions: IStatementAction[];
  actants: IStatementActant[];
  tags: string[]; // ids of IEntity;
}

export interface IStatementAction {
  id: string;
  actionId: string;
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
  entityId: string;
  position: Position;
  elvl: Elvl;
  logic: Logic;
  virtuality: Virtuality;
  partitivity: Partitivity;
  bundleOperator: Operator;
  bundleStart: boolean;
  bundleEnd: boolean;
  props: IProp[];
  classifications: IStatementClassification[];
  identifications: IStatementIdentification[];
}

export interface IStatementClassification {
  id: string;
  entityId: string;
  elvl: Elvl;
  logic: Logic;
  certainty: Certainty;
  mood: Mood[];
  moodvariant: MoodVariant;
}

export interface IStatementIdentification {
  id: string;
  entityId: string;
  elvl: Elvl;
  logic: Logic;
  certainty: Certainty;
  mood: Mood[];
  moodvariant: MoodVariant;
}
