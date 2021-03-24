import { ILabel } from "./";

// TODO
export interface IAction {
  id: string;
  parent: false | string;
  note: string;
  labels: ILabel[];
  types: [];
  valencies: [];
  rulesActants: [];
  rulesProperties: [];
}
