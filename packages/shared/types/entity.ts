import { ActantI } from "./actant";

export interface EntityI extends ActantI {
  class: "E";
  data: { type: "P" | "G" | "O" | "C" | "L" | "V" | "E" };
}
