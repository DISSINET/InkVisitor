/**
 * type of the /tree endpoint response
 */

import { ITerritory } from ".";

// to discuss
export interface IResponseTree extends ITreeTerritoryComponent {}

interface ITreeTerritoryComponent {
  territory: ITerritory;
  statementsCount: number; // number of statements under this territory
  maxLevels: number; // levels of nesting
  children: ITreeTerritoryComponent[];
}
