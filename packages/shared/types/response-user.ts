/**
 * type of the /users endpoint response
 */

import { IResponseActant, IResponseBookmarkFolder } from "./";
import { UserRole } from "./../enums";

export interface IResponseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
