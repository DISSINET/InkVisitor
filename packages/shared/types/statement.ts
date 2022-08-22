import { IEntity, IProp } from "./";
import {
  EntityEnums,
} from "../enums";

export interface IStatement extends IEntity {
  id: string;
  class: EntityEnums.Class.Statement;
  label: string;
  detail: string;
  language: EntityEnums.Language;
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
  elvl: EntityEnums.Elvl;
  certainty: EntityEnums.Certainty;
  logic: EntityEnums.Logic;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant;
  bundleOperator: EntityEnums.Operator;
  bundleStart: boolean;
  bundleEnd: boolean;
  props: IProp[];
}

export interface IStatementActant {
  id: string;
  entityId: string;
  position: EntityEnums.Position;
  elvl: EntityEnums.Elvl;
  logic: EntityEnums.Logic;
  virtuality: EntityEnums.Virtuality;
  partitivity: EntityEnums.Partitivity;
  bundleOperator: EntityEnums.Operator;
  bundleStart: boolean;
  bundleEnd: boolean;
  props: IProp[];
  classifications: IStatementClassification[];
  identifications: IStatementIdentification[];
}

export interface IStatementClassification {
  id: string;
  entityId: string;
  elvl: EntityEnums.Elvl;
  logic: EntityEnums.Logic;
  certainty: EntityEnums.Certainty;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant;
}

export interface IStatementIdentification {
  id: string;
  entityId: string;
  elvl: EntityEnums.Elvl;
  logic: EntityEnums.Logic;
  certainty: EntityEnums.Certainty;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant;
}
