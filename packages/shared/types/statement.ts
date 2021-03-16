import { IActant, IProp, ILabel } from "./";

export interface IStatement extends IActant {
  class: "S";
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
    actants: {
      id: string;
      actant: string; //  this
      position: string;
      elvl: string;
      certainty: string;
    }[];
    //labels: ILabel[];
    props: IProp[]; // this
    references: {
      id: string;
      resource: string;
      part: string;
      type: string;
    }[];
    tags: string[]; // ids of IActant
  };
}
