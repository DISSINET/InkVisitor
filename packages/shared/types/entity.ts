import { Actant } from "./actant";

export interface Entity extends Actant {
  class: "E";
  data: { type: "P" | "G" | "O" | "C" | "L" | "V" | "E" };
}
