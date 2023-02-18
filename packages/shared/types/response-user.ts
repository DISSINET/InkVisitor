/**
 * type of the /users endpoint response
 */

import { EntityEnums } from "@shared/enums";
import { IResponseEntity, IUser, IResponseBookmarkFolder } from "./";

export interface IResponseUser
  extends Omit<IUser, "bookmarks" | "storedTerritories" | "password"> {
  bookmarks: IResponseBookmarkFolder[];
  storedTerritories: IResponseStoredTerritory[];
  territoryRights: IResponseStoredTerritory[];
}

export interface UserOptions {
  defaultTerritory: string;
  defaultLanguage: EntityEnums.Language;
  searchLanguages: EntityEnums.Language[];
}

export interface IResponseStoredTerritory {
  territory: IResponseEntity;
}
