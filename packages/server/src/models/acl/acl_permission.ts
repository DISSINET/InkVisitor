import { IResponsePermission } from "@shared/types";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { IDbModel } from "@models/common";
import { HttpMethods } from "@shared/enums";

export default class AclPermission implements IDbModel, IResponsePermission {
  static table = "acl_permissions";

  id: string;
  controller: string;
  route: string;
  method: HttpMethods;
  roles: string[];
  public: boolean;

  constructor(data: Record<string, any>) {
    this.id = data.id;
    this.controller = data.controller;
    this.route = data.route;
    this.method = data.method;
    this.roles = data.roles;
    this.public = !!data.public;
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
    controller: string,
    method: HttpMethods,
    route: string
  ): Promise<AclPermission[]> {
    const data = await rethink
      .table(AclPermission.table)
      .filter({
        controller,
        method,
        route,
      })
      .run(dbInstance);

    return data.map(d => new AclPermission(d));
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
