/**
 * type of the /user endpoint response
 */

import { ActantI, TerritoryI, StatementI, ResponseActantI } from ".";
import { userRoleDict } from "./../dictionaries";

const userRoleValues = userRoleDict.map((i) => i.value);
export interface ResponseUserI {
    id: string;
    name: string;
    role: typeof userRoleValues[number];
    bookmarks: BookmarkFolderI[];
    storedTerritories: StoredTerritoryI[];
}

interface StoredTerritoryI {
    id: string;
    order: number;
    territory: TerritoryI;
}

interface BookmarkFolderI {
    id: string;
    name: string;
    order: number;
    actants: BookmarkActantI[];
}

interface BookmarkActantI {
    id: string;
    order: number;
    actant: ResponseActantI;
}
