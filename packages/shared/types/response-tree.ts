/**
 * type of the /tree endpoint response
 */

import { ITerritory } from ".";
import { UserEnums } from "../enums";

// to discuss
export interface IResponseTree extends IResponseTreeTerritoryComponent { }

export interface IResponseTreeTerritoryComponent {
  territory: ITerritory;
  path: string[]; // array of parents
  statementsCount: number; // number of statements with this data.territory.id
  lvl: number; // levels of nesting
  children: IResponseTreeTerritoryComponent[];
  empty?: boolean;
  right: UserEnums.RoleMode;
}
