import { ActantI } from "./actant";

export interface TerritoryI extends ActantI {
  class: "T";
  data: {
    content: string;
    language: string;
    parent: string | false;
    type: string;
  };
}
