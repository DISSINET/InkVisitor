import { IActant, IProp } from "./";
import { ActantType } from "../enums";

export interface IStatement extends IActant {
  class: ActantType.Statement;
  data: {
    action: string;
    certainty: string;
    elvl: string;
    modality: string;
    text: string;
    note: string;
    territory: {
      id: string;
      order: number;
    };
    actants: IStatementActant[];
    props: IProp[]; // this
    references: IStatementReference[];
    tags: string[]; // ids of IActant
  };
}

export interface IStatementActant {
  id: string;
  actant: string; //  this
  position: string;
  elvl: string;
  certainty: string;
}

export interface IStatementReference {
  id: string;
  resource: string;
  part: string;
  type: string;
}
