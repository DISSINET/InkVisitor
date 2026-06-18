/**
 * type of the /users endpoint response
 */

import { EntityEnums } from "@inkvisitor/shared/enums";
import { IResponseEntity, IUser, IResponseBookmarkFolder } from "./";

export interface IResponseUser
  extends Omit<IUser, "bookmarks" | "storedTerritories" | "password"> {
  bookmarks: IResponseBookmarkFolder[];
  storedTerritories: IResponseStoredTerritory[];
  territoryRights: IResponseStoredTerritory[];
  // Resolved Resource entities the user is assigned to annotate (rights with
  // mode === Annotate). Mirrors territoryRights.
  resourceRights: IResponseUserResourceRight[];
}

export interface UserOptions {
  defaultTerritory: string;
  defaultLanguage: EntityEnums.Language;
  searchLanguages: EntityEnums.Language[];
}

export interface IResponseStoredTerritory {
  territory: IResponseEntity;
}

export interface IResponseUserResourceRight {
  resource: IResponseEntity;
}
