import { ActantI } from "./actant";

export interface ResourceI extends ActantI {
  class: "R";
  data: {
    content: string;
    link: string;
    type: string;
    label: string;
    language: string;
  };
  meta: {
    created: {
      user: string;
      time: string;
    };
  };
}
