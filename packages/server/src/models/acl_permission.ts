import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IDbModel } from "./common";

export default class AclPermission implements IDbModel {
  id?: string;
  controller: string;
  method: string;
  userIds: string[];

  static table = "acl_permissions";

  constructor(data: Record<string, any>) {
    this.controller = data.controller;
    this.method = data.method;
    this.userIds = data.userIds;
  }

  async save(dbInstance: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(AclPermission.table)
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
      .table(AclPermission.table)
      .get(this.id)
      .update(updateData)
      .run(dbInstance);
  }

  delete(dbInstance: Connection | undefined): Promise<WriteResult> {
    return rethink
      .table(AclPermission.table)
      .get(this.id)
      .delete()
      .run(dbInstance);
  }

  isValid(): boolean {
    return true;
  }

  isUserAllowed(userId: string): boolean {
    return (
      this.userIds &&
      !!this.userIds.length &&
      this.userIds.indexOf(userId) !== -1
    );
  }

  static async findByPath(
    dbInstance: Connection | undefined,
    ctrlName: string,
    method: string
  ): Promise<AclPermission> {
    const data = await rethink
      .table("actants")
      .filter({
        controller: ctrlName,
        method: method,
      })
      .run(dbInstance);

    return new AclPermission(data);
  }
}
