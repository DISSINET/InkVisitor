/**
 * type of the /tree endpoint response
 */

import { TerritoryI } from ".";

// to discuss
export interface ResponseTreeI {
    tree: {
        TreeTerritoryComponentI;
    };
    maxLevels: number; // levels of nesting
}

interface TreeTerritoryComponentI {
    territory: TerritoryI;
    statementsCount: number; // number of statements under this territory
    children: TreeTerritoryComponentI[];
}
