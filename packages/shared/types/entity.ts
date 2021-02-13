import { ActantI, LabelI } from "./";

export interface EntityI extends ActantI {
    class: "P" | "G" | "O" | "C" | "L" | "V" | "E";
    meta: {
        created: {
            user: string;
            time: string;
        };
    };
}
