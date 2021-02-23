import { IActant } from "./actant";
import { languageDict } from "./../dictionaries";

const languageValues = languageDict.map((i) => i.value);
export interface ITerritory extends IActant {
    class: "T";
    data: {
        parent: ParentTerritoryI | false;
        type: string; // territoryTypeDict
        content: string;
        lang: typeof languageValues[number];
    };
}

interface ParentTerritoryI {
    id: string;
    order: number;
}
