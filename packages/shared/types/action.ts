import { IActant } from "./";

// TODO
export interface IAction extends IActant {
  data: {
    valencies: ActionValency;
    entities: ActionEntity;
    properties: any[];
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
