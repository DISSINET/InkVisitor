/**
 *
 */

import { IResponseActant } from ".";

export interface IResponseBookmarks {
  bookmarks: IResponseBookmarkFolder[];
}

export interface IResponseBookmarkFolder {
  id: string;
  name: string;
  actants: IResponseActant[];
}
