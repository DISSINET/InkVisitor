/**
 * type of the /tree endpoint response
 */

import { ITerritory } from ".";

// to discuss
export interface IResponseTree extends IResponseTreeTerritoryComponent {}

export interface IResponseTreeTerritoryComponent {
    territory: ITerritory;
    statementsCount: number; // number of statements with this data.territory.id
    lvl: number; // levels of nesting
    children: IResponseTreeTerritoryComponent[];
}
