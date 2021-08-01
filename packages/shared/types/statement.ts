import { IActant, IProp } from "./";
import { IOperator } from "./";
import {
  ActantType,
  StatementCertainty,
  StatementElvls,
  StatementPositions,
} from "../enums";

export interface IStatement extends IActant {
  class: ActantType.Statement;
  data: {
    action: string;
    certainty: StatementCertainty;
    elvl: StatementElvls;
    modality: string;
    text: string;
    note: string;
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

export interface IStatementActant {
  id: string;
  actant: string;
  position: StatementPositions;

  // todo: make mandatory
  operator?: IOperator;
  elvl: StatementElvls;
  certainty: StatementCertainty;
}

export interface IStatementReference {
  id: string;
  resource: string;
  part: string;
  type: string;
}
