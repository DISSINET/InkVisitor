/**
 * type of the /users endpoint response
 */

import { IResponseActant, IResponseBookmarkFolder } from "./";
import { UserRoles } from "./../enums";

export interface IResponseUser {
  id: string;
  email: string;
  name: string;
  role: UserRoles;
  bookmarks: IResponseBookmarkFolder[];
  storedTerritories: IResponseStoredTerritory[];
}

export interface UserOptions {
  defaultTerritory: string;
  defaultLanguage: string;
  searchLanguages: string[];
}

export interface IResponseStoredTerritory {
  territory: IResponseActant;
}
