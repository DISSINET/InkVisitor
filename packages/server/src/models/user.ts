import {
  IUser,
  IUserOptions,
  IBookmarkFolder,
  IStoredTerritory,
  IUserRight,
  IUserRole,
} from "@shared/types";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IDbModel } from "./common";
import { userRoleDict } from "@shared/dictionaries";

const userRoleValues = userRoleDict.map((i) => i.label);

export default class User implements IDbModel, IUser {
  id: string;
  email: string;
  name: string;
  role: typeof userRoleValues[number];
  options: IUserOptions;
  bookmarks: IBookmarkFolder[];
  storedTerritories: IStoredTerritory[];
  rights: IUserRight[];

  static table = "users";

  constructor(data: Record<string, any>) {
    this.rights = []; // deprecated

    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role;
    this.options = data.options;
    this.bookmarks = data.bookmarks;
    this.storedTerritories = data.storedTerritories;
  }

  async save(dbInstance: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(User.table)
      .insert({ ...this, id: this.id || undefined })
      .run(dbInstance);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result;
  }

  update(
    dbInstance: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
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
    return true;
  }

  static async getUser(
    dbInstance: Connection | undefined,
    id: string
  ): Promise<User> {
    const data = await rethink.table(User.table).get(id).run(dbInstance);
    return new User(data);
  }
}
