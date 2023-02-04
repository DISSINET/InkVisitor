import { IEntity, IProp } from "./";
import { EntityEnums } from "../enums";

export const ROOT_TERRITORY_ID = "T0";

export interface IStatement extends IEntity {
  class: EntityEnums.Class.Statement;
  data: IStatementData;
}

export interface IStatementData {
  text: string;
  territory?: IStatementDataTerritory;
  actions: IStatementAction[];
  actants: IStatementActant[];
  tags: string[]; // ids of IEntity;
}

export interface IStatementDataTerritory {
  territoryId: string;
  order: number;
}

export type StatementObject = IStatementClassification | IStatementIdentification | IProp | IStatementActant | IStatementAction;

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
  statementOrder: number | false;
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
  statementOrder: number | false;
}

export interface IStatementClassification {
  id: string;
  entityId: string;
  elvl: EntityEnums.Elvl;
  logic: EntityEnums.Logic;
  certainty: EntityEnums.Certainty;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant;
  statementOrder: number | false;
}

export interface IStatementIdentification {
  id: string;
  entityId: string;
  elvl: EntityEnums.Elvl;
  logic: EntityEnums.Logic;
  certainty: EntityEnums.Certainty;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant;
  statementOrder: number | false;
}
