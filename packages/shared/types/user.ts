import { EntityEnums, UserEnums } from "@shared/enums";

export interface IUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  hash?: string;
  role: UserEnums.Role;
  options: IUserOptions;
  bookmarks: IBookmarkFolder[];
  storedTerritories: IStoredTerritory[];
  rights: IUserRight[];
  active: boolean; // enabled/disabled - set to true in activation, but can be toggled in admin
  verified: boolean; // email verified - set to true in activation
}

export interface IUserRight {
  territory: string; // entity id
  mode: UserEnums.RoleMode;
}

export interface IUserOptions {
  defaultTerritory: string;

  // the language for the newly created entities
  defaultLanguage: EntityEnums.Language;

  // the language of the source documents
  defaultStatementLanguage?: EntityEnums.Language;
  searchLanguages: EntityEnums.Language[];
  hideStatementElementsOrderTable?: boolean;
}

export interface IStoredTerritory {
  territoryId: string; // reference to entities table, for response type see IResponseStoredTerritory
  // more field could be added here
}

export interface IBookmarkFolder {
  id: string;
  name: string;
  entityIds: string[]; // list of ids are stored in the db, for response type see IResponseBookmarks
}
