import { IActant, IProp } from "./";

export interface IStatement extends IActant {
  class: "S";
  data: {
    action: string;
    territory: {
      id: string;
      order: number;
    };
    references: {
      id: string;
      resource: string;
      part: string;
      type: string;
    }[];
    tags: string[]; // ids of IActant
    certainty: string;
    elvl: string;
    modality: string;
    text: string;
    note: string;
    props: IProp[]; // this
    actants: {
      id: string;
      actant: string; //  this
      position: string;
      elvl: string;
      certainty: string;
    }[];
  };
}
