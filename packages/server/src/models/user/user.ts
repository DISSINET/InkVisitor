import {
  IUser,
  IUserOptions,
  IBookmarkFolder,
  IStoredTerritory,
  IUserRight,
} from "@shared/types";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import {
  IDbModel,
  fillArray,
  fillFlatObject,
  UnknownObject,
} from "@models/common";
import { UserEnums } from "@shared/enums";
import { ModelNotValidError } from "@shared/types/errors";
import { generateRandomString, generateUuid, hashPassword } from "@common/auth";
import { regExpEscape } from "@common/functions";
import { nonenumerable } from "@common/decorators";

export class UserRight implements IUserRight {
  territory = "";
  mode: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(data: IUserRight) {
    this.territory = data.territory;
    this.mode = data.mode;
  }

  isValid(): boolean {
    return !!this.territory;
  }
}

export class UserOptions implements IUserOptions {
  defaultTerritory: string = "";
  defaultLanguage: string = "";
  searchLanguages: string[] = [];

  constructor(data: Partial<IUserOptions>) {
    fillFlatObject(this, data);
    fillArray(this.searchLanguages, String, data?.searchLanguages || []);
  }

  isValid(): boolean {
    if (this.searchLanguages.find((lang) => !lang)) {
      return false;
    }

    return true;
  }
}

export class BookmarkFolder implements IBookmarkFolder {
  id: string = "";
  name: string = "";
  entityIds: string[] = [];

  constructor(data: Partial<IBookmarkFolder>) {
    fillFlatObject(this, data);
    fillArray(this.entityIds, String, data.entityIds);
  }

  isValid(): boolean {
    if (!this.id) {
      return false;
    }

    if (!this.name) {
      return false;
    }

    if (this.entityIds.find((a) => !a)) {
      return false;
    }

    return true;
  }
}

export class StoredTerritory implements IStoredTerritory {
  territoryId: string;

  constructor(data: Partial<IStoredTerritory>) {
    this.territoryId = data.territoryId as string;
  }

  isValid(): boolean {
    return !!this.territoryId;
  }
}

export default class User implements IUser, IDbModel {
  id: string = "";
  email: string = "";

  @nonenumerable
  password: string = "";

  name: string = "";
  role: UserEnums.Role = UserEnums.Role.Viewer;
  active: boolean = false;
  options: UserOptions = new UserOptions({});
  bookmarks: BookmarkFolder[] = [];
  storedTerritories: StoredTerritory[] = [];
  rights: UserRight[] = [];

  hash?: string = "";

  static table = "users";

  constructor(data: Partial<IUser>) {
    fillFlatObject(this, data);
    this.options = new UserOptions(data.options as IUserOptions);
    fillArray<IBookmarkFolder>(this.bookmarks, BookmarkFolder, data.bookmarks);
    fillArray(this.storedTerritories, StoredTerritory, data.storedTerritories);
    fillArray<IUserRight>(this.rights, UserRight, data.rights);
  }

  /**
  * Stores the user in the db
  * @param db db connection
  * @returns Promise<boolean> to indicate result of the operation
  */
  async save(dbInstance: Connection | undefined): Promise<boolean> {
    const result = await rethink
      .table(User.table)
      .insert({ ...this, id: this.id || undefined })
      .run(dbInstance);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1;
  }

  update(
    dbInstance: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    const snapshot = new User({
      ...JSON.parse(JSON.stringify(this)),
      ...updateData,
    });

    if (!snapshot.isValid()) {
      throw new ModelNotValidError("model not valid");
    }

    return rethink
      .table(User.table)
      .get(this.id)
      .update(updateData)
      .run(dbInstance);
  }

  delete(dbInstance: Connection | undefined): Promise<WriteResult> {
    return rethink.table(User.table).get(this.id).delete().run(dbInstance);
  }

  isValid(): boolean {
    if (this.email == "" || this.name == "") {
      return false;
    }

    if (
      !this.options.isValid() ||
      !!this.bookmarks.find((b) => !b.isValid()) ||
      !!this.storedTerritories.find((t) => !t.isValid()) ||
      !!this.rights.find((t) => !t.isValid())
    ) {
      return false;
    }

    return true;
  }

  generatePassword(): string {
    const raw = generateRandomString(10);
    this.password = hashPassword(raw);
    return raw;
  }

  generateHash(): string {
    // should be unique - time based uuid
    this.hash = generateUuid();
    return this.hash;
  }

  static async getUser(
    dbInstance: Connection | undefined,
    id: string
  ): Promise<User | null> {
    const data = await rethink.table(User.table).get(id).run(dbInstance);
    if (data) {
      delete data.password;
      return new User(data);
    }
    return null;
  }

  static async getUserByHash(
    dbInstance: Connection | undefined,
    hash: string
  ): Promise<User | null> {
    const data = await rethink
      .table(User.table)
      .filter({ hash })
      .run(dbInstance);
    if (data && data.length) {
      return new User(data[0]);
    }
    return null;
  }

  static async findAllUsers(
    dbInstance: Connection | undefined
  ): Promise<User[]> {
    const data = await rethink
      .table(User.table)
      .orderBy(rethink.asc("role"), rethink.asc("name"))
      .run(dbInstance);
    return data.map((d) => new User(d));
  }

  static async findUserByLabel(
    dbInstance: Connection | undefined,
    label: string
  ): Promise<User | null> {
    const data = await rethink
      .table(User.table)
      .filter(function (user: any) {
        return rethink.or(
          rethink.row("name").eq(label),
          rethink.row("email").eq(label)
        );
      })
      .limit(1)
      .run(dbInstance);
    return data.length == 0 ? null : new User(data[0]);
  }

  static async findUsersByLabel(
    dbInstance: Connection | undefined,
    label: string
  ): Promise<User[]> {
    const data = await rethink
      .table(User.table)
      .filter(function (user: any) {
        return rethink.or(
          rethink
            .row("name")
            .downcase()
            .match(`${regExpEscape(label.toLowerCase())}`)
            .or(),
          rethink
            .row("email")
            .downcase()
            .match(`${regExpEscape(label.toLowerCase())}`)
            .or()
        );
      })
      .run(dbInstance);
    return data.map((d) => new User(d));
  }
}
