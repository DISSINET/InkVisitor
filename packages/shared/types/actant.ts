export interface IActant {
  id: string;
  class: "T" | "S" | "R" | "P" | "G" | "O" | "C" | "L" | "V" | "E";
  label: string;
  data: object;
}
