import { Request } from "express";
import { UserRole } from "@shared/enums";
import {
  IBookmarkFolder,
  IResponseBookmarkFolder,
  IResponseStoredTerritory,
  IResponseUser,
  IStoredTerritory,
  IUser,
  IUserOptions,
  IUserRight,
} from "@shared/types";
import { findActantById, findActantsById } from "@service/shorthands";

export class ResponseUser implements IResponseUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  options: IUserOptions;
  rights: IUserRight[];
  active: boolean;

  _userBookmarks: IBookmarkFolder[];
  _userStoredTerritories: IStoredTerritory[];

  bookmarks: IResponseBookmarkFolder[];
  storedTerritories: IResponseStoredTerritory[];
  territoryRights: IResponseStoredTerritory[];

  constructor(user: IUser) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.password = user.password;
    this.role = user.role;
    this.options = user.options;
    this.rights = user.rights;
    this.active = user.active;

    this._userBookmarks = user.bookmarks;
    this._userStoredTerritories = user.storedTerritories;

    this.bookmarks = [];
    this.storedTerritories = [];
    this.territoryRights = [];
  }

  async unwindBookmarks(req: Request): Promise<void> {
    for (const bookmark of this._userBookmarks) {
      const bookmarkResponse: IResponseBookmarkFolder = {
        id: bookmark.id,
        name: bookmark.name,
        actants: [],
      };
      if (bookmark.actantIds && bookmark.actantIds.length) {
        for (const actant of await findActantsById(
          req.db,
          bookmark.actantIds
        )) {
          bookmarkResponse.actants.push({
            ...actant,
          });
        }
      }
      this.bookmarks.push(bookmarkResponse);
    }
  }

  async unwindTerritories(req: Request): Promise<void> {
    for (const territory of this._userStoredTerritories) {
      const territoryResponse: IResponseStoredTerritory = {
        territory: {
          ...(await findActantById(req.db, territory.territoryId)),
        },
      };
      this.storedTerritories.push(territoryResponse);
    }
  }

  async unwindRights(req: Request): Promise<void> {
    for (const right of this.rights) {
      const territoryFromRights: IResponseStoredTerritory = {
        territory: {
          ...(await findActantById(req.db, right.territory)),
        },
      };
      this.territoryRights.push(territoryFromRights);
    }
  }

  async unwindAll(req: Request) {
    await this.unwindBookmarks(req);
    await this.unwindTerritories(req);
    await this.unwindRights(req);
  }
}
