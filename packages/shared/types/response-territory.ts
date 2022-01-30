/**
 * type of the /territory endpoint response
 */

import { UserRoleMode } from "../enums";
import { IEntity, ITerritory } from "./";
import { IResponseStatement } from "./response-statement";

// to discuss
export interface IResponseTerritory extends ITerritory {
  statements: IResponseStatement[]; // sorted statements with same territoryId
  actants: IEntity[]; // all actants in the statements (actants.actant & tags & props.value.id & props.type.id & props.origin)
  right: UserRoleMode;
}
