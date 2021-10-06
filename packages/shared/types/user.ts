import { UserRole, UserRoleMode } from "./../enums";

export interface IUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  options: IUserOptions;
  bookmarks: IBookmarkFolder[];
  storedTerritories: IStoredTerritory[];
  rights: IUserRight[];
}

export interface IUserRole {
  label: string;
  info: string;
}

export interface IUserRight {
  territory: string; // actant id
  mode: UserRoleMode;
}

export interface IUserOptions {
  defaultTerritory: string;
  defaultLanguage: string;
  searchLanguages: string[];
}

export interface IStoredTerritory {
  territoryId: string; // reference to actants table, for response type see IResponseStoredTerritory
  // more field could be added here
}

export interface IBookmarkFolder {
  id: string;
  name: string;
  actantIds: string[]; // list of ids are stored in the db, for response type see IResponseBookmarks
}
