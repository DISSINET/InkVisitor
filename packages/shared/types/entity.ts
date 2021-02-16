import { ActantI, LabelI } from "./";
import { entityLogicalTypeDict } from "./../dictionaries";

const entityLogicalTypeValues = entityLogicalTypeDict.map((i) => i.value);
export interface EntityI extends ActantI {
    class: "P" | "G" | "O" | "C" | "L" | "V" | "E";
    logicalType: typeof entityLogicalTypeValues[number];
}
