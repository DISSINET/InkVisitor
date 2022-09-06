import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

// TODO
export interface IAction extends IEntity {
  class: EntityEnums.Class.Action;
  data: IActionData;
}

export interface IActionData {
  valencies: ActionValency;
  entities: ActionEntity;
}

export interface ActionValency {
  s: string;
  a1: string;
  a2: string;
}

export interface ActionEntity {
  s: string[];
  a1: string[];
  a2: string[];
}
