import { IResponseActant } from "./";
import { userRoleDict } from "./../dictionaries";

const userRoleValues = userRoleDict.map((i) => i.value);
export interface IUser {
    id: string;
    email: string;
    name: string;
    password?: string;
    role: typeof userRoleValues[number];
    options: IUserOptions;
    bookmarks: IBookmarkFolder[];
    storedTerritories: IStoredTerritory[];
    rights: IUserRight[];
}

export interface IUserRight {
    territory: string;
    mode: string; // probably write | read | admin...
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
    name: string;
    actantIds: string[]; // list of ids are stored in the db, for response type see IResponseBookmarks
}
