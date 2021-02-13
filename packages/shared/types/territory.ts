import { ActantI } from "./actant";

export interface TerritoryI extends ActantI {
    class: "T";
    parent: ParentTerritoryI;
}

interface ParentTerritoryI {
    id: string;
    order: number;
}
