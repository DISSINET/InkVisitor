import { IOperator } from "./";
import { StatementCertainty, StatementElvl } from "../enums";

export interface IProp {
  id: string;
  elvl: StatementElvl;
  certainty: StatementCertainty;
  modality: string;
  origin: string;

  // todo: make mandatory
  operator?: IOperator;
  type: {
    id: string;
    certainty: StatementCertainty;
    elvl: StatementElvl;
  };
  value: {
    id: string;
    certainty: StatementCertainty;
    elvl: StatementElvl;
  };
}
