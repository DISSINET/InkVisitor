/**
 * type of the /territory endpoint response
 */

import { UserRoleMode } from "../enums";
import { IEntity, ITerritory } from "./";
import { IResponseStatement } from "./response-statement";

// to discuss
export interface IResponseTerritory extends ITerritory {
  statements: IResponseStatement[]; // sorted statements with same territoryId
  entities: { [key: string]: IEntity }; // all entities in the statements (actants.actant & tags & props.value.id & props.type.id & props.origin)
  right: UserRoleMode;
}
