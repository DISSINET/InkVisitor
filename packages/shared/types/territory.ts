import { ActantI } from "./actant";

export interface TerritoryI extends ActantI {
  class: "T";
  data: {
    label: string;
    parent: string | false;
  };
  meta: {};
}
