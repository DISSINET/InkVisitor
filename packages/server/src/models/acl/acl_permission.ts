import { IResponsePermission } from "@shared/types";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { IDbModel } from "@models/common";

export default class AclPermission implements IDbModel, IResponsePermission {
  id: string;
  controller: string;
  route: string;
  roles: string[];

  static table = "acl_permissions";

  constructor(data: Record<string, any>) {
    this.id = data.id;
    this.controller = data.controller;
    this.route = data.route || data.method;
    this.roles = data.roles;
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

  isRoleAllowed(group: string): boolean {
    return (
      this.roles &&
      !!this.roles.length &&
      (this.roles.indexOf("*") !== -1 || this.roles.indexOf(group) !== -1)
    );
  }

  static async findByRoute(
    dbInstance: Connection | undefined,
    ctrlName: string,
    route: string
  ): Promise<AclPermission | null> {
    const data = await rethink
      .table(AclPermission.table)
      .filter({
        controller: ctrlName,
      })
      .filter(function (row: RDatum) {
        return rethink.or(
          row.hasFields("method").and(row("method").eq(route)), // DEPRECATED
          row.hasFields("route").and(row("route").eq(route))
        );
      })
      .run(dbInstance);

    if (!data.length) {
      return null;
    }
    return new AclPermission(data[0]);
  }

  static async findById(
    dbInstance: Connection | undefined,
    id: string
  ): Promise<AclPermission | null> {
    const data = await rethink
      .table(AclPermission.table)
      .get(id)
      .run(dbInstance);

    if (!data) {
      return null;
    }
    return new AclPermission(data);
  }

  static async fetchAll(
    dbInstance: Connection | undefined
  ): Promise<IResponsePermission[]> {
    const data = await rethink.table(AclPermission.table).run(dbInstance);
    return data;
  }
}
