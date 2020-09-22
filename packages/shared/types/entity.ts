import { ActantI } from "./actant";

export interface EntityI extends ActantI {
  class: "P" | "G" | "O" | "C" | "L" | "V" | "E";
  id: string;
  data: {
    label: string;
  };
  meta: {
    created: {
      user: string;
      time: string;
    };
  };
}
