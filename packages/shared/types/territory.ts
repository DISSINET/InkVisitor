import { ActantI } from "./actant";

export interface TerritoryI extends ActantI {
    class: "T";
    data: {
        parent: string | false;
    };
    meta: {};
}
