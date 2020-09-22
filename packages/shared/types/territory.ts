import { ActantI } from "./actant";

export interface TerritoryI extends ActantI {
  class: "T";
  data: {
    label: string;
    content: string;
    language: string;
    parent: string | false;
    type: string;
  };
  meta: {
    created: {
      user: string;
      time: string;
    };
  };
}
