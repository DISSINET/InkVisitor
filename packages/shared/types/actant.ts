import { LabelI } from "./";

export interface ActantI {
    id: string;
    class: "T" | "S" | "R" | "P" | "G" | "O" | "C" | "L" | "V" | "E";
    labels: LabelI[];
    data: {};
}
