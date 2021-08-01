import { IActant, IProp } from "./";
import { IOperator } from "./";
import {
  ActantType,
  StatementCertainty,
  StatementElvl,
  StatementPosition,
} from "../enums";

export interface IStatement extends IActant {
  class: ActantType.Statement;
  data: {
    actions: IStatementAction[];
    modality: string;
    text: string;
    territory: {
      id: string;
      order: number;
    };
    actants: IStatementActant[];
    props: IProp[];
    references: IStatementReference[];
    tags: string[]; // ids of IActant;
  };
}

export interface IStatementAction {
  id: string;
  action: string;
  operator?: IOperator;
  elvl: StatementElvl;
  certainty: StatementCertainty;
}

export interface IStatementActant {
  id: string;
  actant: string;
  position: StatementPosition;

  // todo: make mandatory
  operator?: IOperator;
  elvl: StatementElvl;
  certainty: StatementCertainty;
}

export interface IStatementReference {
  id: string;
  resource: string;
  part: string;
  type: string;
}
