import { IOperator } from "./";
import { StatementCertainty, StatementElvls } from "../enums";

export interface IProp {
  id: string;
  elvl: StatementElvls;
  certainty: StatementCertainty;
  modality: string;
  origin: string;

  // todo: make mandatory
  operator?: IOperator;
  type: {
    id: string;
    certainty: StatementCertainty;
    elvl: StatementElvls;
  };
  value: {
    id: string;
    certainty: StatementCertainty;
    elvl: StatementElvls;
  };
}
