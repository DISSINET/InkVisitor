/**
 * type of the /users endpoint response
 */

import { IResponseActant, IUser, IResponseBookmarkFolder } from "./";
import { UserRole } from "./../enums";

export interface IResponseUser extends Omit<IUser, 'bookmarks' | 'storedTerritories' | 'password'> {
  bookmarks: IResponseBookmarkFolder[];
  storedTerritories: IResponseStoredTerritory[];
  territoryRights: IResponseStoredTerritory[];
}

export interface UserOptions {
  defaultTerritory: string;
  defaultLanguage: string;
  searchLanguages: string[];
}

export interface IResponseStoredTerritory {
  territory: IResponseActant;
}
