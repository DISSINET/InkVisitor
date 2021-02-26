/**
 *
 */

import { IResponseActant } from ".";

export interface IResponseBookmarks {
    bookmarks: IBookmarkFolder[];
}

interface IBookmarkFolder {
    id: string;
    name: string;
    order: number;
    actants: IBookmarkActant[];
}

interface IBookmarkActant {
    id: string;
    order: number;
    actant: string;
}
