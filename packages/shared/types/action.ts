import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

// TODO
export interface IAction extends IEntity {
  class: EntityEnums.Class.Action;
  data: IActionData;
}

export interface IActionData {
  valencies: IActionValency;
  entities: IActionEntity;
}

export interface IActionValency {
  s: string;
  a1: string;
  a2: string;
}

export interface IActionEntity {
  s: string[];
  a1: string[];
  a2: string[];
}
