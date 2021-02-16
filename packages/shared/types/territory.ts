import { ActantI } from "./actant";

export interface TerritoryI extends ActantI {
    class: "T";
    parent: ParentTerritoryI;
    type: string; // territoryTypeDict
}

interface ParentTerritoryI {
    id: string;
    order: number;
}
