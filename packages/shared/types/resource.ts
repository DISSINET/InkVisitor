import { Actant } from "./actant";

export interface Resource extends Actant {
  class: "R";
  data: {
    content: string;
    link: string;
    type: string;
    language: string;
  };
}
