import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

export interface IAction extends IEntity {
  class: EntityEnums.Class.Action;
  data: IActionData;
}

export interface IActionData {
  valencies: IActionValency;
  entities: IActionEntity;
  pos: EntityEnums.ActionPartOfSpeech.Verb;
}

export interface IActionValency {
  s: string;
  a1: string;
  a2: string;
}

export interface IActionEntity {
  s?: EntityEnums.ExtendedClass[];
  a1?: EntityEnums.ExtendedClass[];
  a2?: EntityEnums.ExtendedClass[];
}
