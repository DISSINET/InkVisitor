import { ILabel } from "./";

export interface IActant {
    id: string;
    class: "T" | "S" | "R" | "P" | "G" | "O" | "C" | "L" | "V" | "E";
    labels: ILabel[];
    data: object;
}
