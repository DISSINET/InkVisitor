import Entity from "@models/entity/entity";
import { findEntityById } from "@service/shorthands";
import { UserEnums } from "@shared/enums";
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
import { nonenumerable } from "@common/decorators";
import { IRequest } from "src/custom_typings/request";
import { InternalServerError } from "@shared/types/errors";

export class ResponseUser implements IResponseUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: UserEnums.Role;
  options: IUserOptions;
  rights: IUserRight[];
  active: boolean;

  @nonenumerable
  _userBookmarks: IBookmarkFolder[];
  @nonenumerable
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

  async unwindBookmarks(req: IRequest): Promise<void> {
    for (const bookmark of this._userBookmarks) {
      const bookmarkResponse: IResponseBookmarkFolder = {
        id: bookmark.id,
        name: bookmark.name,
        entities: [],
      };
      if (bookmark.entityIds && bookmark.entityIds.length) {
        for (const entity of await Entity.findEntitiesByIds(
          req.db.connection,
          bookmark.entityIds
        )) {
          // preserve original order of entityIds
          const index = bookmark.entityIds.findIndex((id) => id === entity.id);
          if (index !== -1) {
            bookmarkResponse.entities[index] = entity;
          } else {
            throw new InternalServerError(
              `cannot find original position for bookmark.entityIds (bookmark=${bookmark.id}, entity=${entity.id})`
            );
          }
        }
      }
      this.bookmarks.push(bookmarkResponse);
    }
  }

  async unwindTerritories(req: IRequest): Promise<void> {
    for (const territory of this._userStoredTerritories) {
      const territoryResponse: IResponseStoredTerritory = {
        territory: {
          ...(await findEntityById(req.db, territory.territoryId)),
        },
      };
      this.storedTerritories.push(territoryResponse);
    }
  }

  async unwindRights(req: IRequest): Promise<void> {
    for (const right of this.rights) {
      const territoryFromRights: IResponseStoredTerritory = {
        territory: {
          ...(await findEntityById(req.db, right.territory)),
        },
      };
      this.territoryRights.push(territoryFromRights);
    }
  }

  async unwindAll(req: IRequest) {
    await this.unwindBookmarks(req);
    await this.unwindTerritories(req);
    await this.unwindRights(req);
  }
}
