import { Actant } from "./";

export interface Statement extends Actant {
  class: "S";
  data: {
    action: string;
    territory: string;
    references: { resource: string; part: string; type: string }[];
    tags: string[];
    certainty: string;
    elvl: string;
    modality: string;
    text: string;
    note: string;
    props: {
      id: string;
      subject: string;
      actant1: string;
      actant2: string;
      elvl: string;
      certainty: string;
    }[];
    actants: {
      actant: string;
      position: string;
      elvl: string;
      certainty: string;
    }[];
  };
}
