export interface ActantI {
  id: string;
  class: "T" | "S" | "R" | "P" | "G" | "O" | "C" | "L" | "V" | "E";
  data: {
    label: string;
  };
  meta: {};
}
