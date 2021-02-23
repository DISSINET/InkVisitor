import { IActant, ILabel } from "./";
import { entityLogicalTypeDict } from "./../dictionaries";

const entityLogicalTypeValues = entityLogicalTypeDict.map((i) => i.value);
export interface IEntity extends IActant {
    class: "P" | "G" | "O" | "C" | "L" | "V" | "E";
    data: {
        logicalType: typeof entityLogicalTypeValues[number];
    };
}
