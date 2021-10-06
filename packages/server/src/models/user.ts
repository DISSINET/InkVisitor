import {
  IUser,
  IUserOptions,
  IBookmarkFolder,
  IStoredTerritory,
  IUserRight,
} from "@shared/types";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IDbModel } from "./common";
import { UserRole } from "@shared/enums";

export default class User implements IDbModel, IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  options: IUserOptions;
  bookmarks: IBookmarkFolder[];
  storedTerritories: IStoredTerritory[];
  rights: IUserRight[];
  password = "";

  static table = "users";

  constructor(data: Record<string, any>) {
    this.rights = []; // deprecated

    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
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
}
