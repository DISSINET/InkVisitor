import { ActantI } from "./actant";

export interface ResourceI extends ActantI {
  class: "R";
  data: {
    content: string;
    link: string;
    type: string;
    language: string;
  };
}
