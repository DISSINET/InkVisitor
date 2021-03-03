/**
 *
 */

import { IResponseActant } from ".";

export interface IResponseBookmarks {
  bookmarks: IResponseBookmarkFolder[];
}

export interface IResponseBookmarkFolder {
  name: string;
  actants: IResponseActant[];
}
