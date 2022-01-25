import { ActantType } from "../enums";
import { IActant } from "./";

// TODO
export interface IAction extends IActant {
  class: ActantType.Action;
  data: {
    valencies: ActionValency;
    entities: ActionEntity;
  };
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
