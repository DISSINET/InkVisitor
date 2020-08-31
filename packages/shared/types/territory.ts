import { Actant } from "./actant";

export interface Territory extends Actant {
  class: "T";
  data: {
    content: string;
    language: string;
    parent: string | false;
    type: string;
  };
}
