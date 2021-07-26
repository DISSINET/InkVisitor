import { IOperator } from "./";

export interface IProp {
  id: string;
  elvl: string;
  certainty: string;
  modality: string;
  origin: string;

  // todo: make mandatory
  operator?: IOperator;
  type: {
    id: string;
    certainty: string;
    elvl: string;
  };
  value: {
    id: string;
    certainty: string;
    elvl: string;
  };
}
  