/**
 * type of the /tree endpoint response
 */

import { ITerritory } from ".";

// to discuss
export interface IResponseTree {
    tree: {
        ITreeTerritoryComponent;
    };
    maxLevels: number; // levels of nesting
}

interface ITreeTerritoryComponent {
    territory: ITerritory;
    statementsCount: number; // number of statements under this territory
    children: ITreeTerritoryComponent[];
}
