import { IActant } from "./actant";

export interface ITerritory extends IActant {
    class: "T";
    data: {
        parent: ParentTerritoryI;
        type: string; // territoryTypeDict
    };
}

interface ParentTerritoryI {
    id: string;
    order: number;
}
