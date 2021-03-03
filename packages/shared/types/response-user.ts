/**
 * type of the /users endpoint response
 */

import { IResponseActant, IBookmarkFolder, IResponseBookmarkFolder } from "./";
import { userRoleDict } from "./../dictionaries";

const userRoleValues = userRoleDict.map((i) => i.value);

export interface IResponseUser {
  id: string;
  email: string;
  name: string;
  role: typeof userRoleValues[number];
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
