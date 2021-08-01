import { ILabel, IActant } from "./";

// TODO
export interface IAction extends IActant {
  id: string;
  data: {
    valencies: {
      s: string;
      a1: string;
      a2: string;
    };

    entities: {
      s: string[];
      a1: string[];
      a2: string[];
    };

    properties: [];
  };
}
