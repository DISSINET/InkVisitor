import { ActantI } from "./actant";

export interface EntityI extends ActantI {
  class: "P" | "G" | "O" | "C" | "L" | "V" | "E";
  data: {};
}
