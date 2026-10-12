import { IResponsePermission } from "@inkvisitor/shared/types";
import { Conn, WriteResult, storage } from "@service/storage";
import { IDbModel } from "@models/common";
import { HttpMethods, UserEnums } from "@inkvisitor/shared/enums";

export default class AclPermission implements IDbModel, IResponsePermission {
  static table = "acl_permissions";

  id: string;
  controller: string;
  route: string;
  method: HttpMethods;
  roles: UserEnums.Role[];
  public: boolean;

  constructor(data: Record<string, any>) {
    this.id = data.id;
    this.controller = data.controller;
    this.route = data.route;
    this.method = data.method;
    this.roles = data.roles;
    this.public = !!data.public;
  }

  /**
   * Stores the permission in the db
   * @param db db connection
   * @returns Promise<boolean> to indicate result of the operation
   */
  async save(dbInstance: Conn | undefined): Promise<boolean> {
    const result = await storage.acl.insert(dbInstance as Conn, {
      ...this,
      id: this.id || undefined,
    });

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1;
  }

  update(
    dbInstance: Conn | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    return storage.acl.update(dbInstance as Conn, this.id, updateData);
  }

  delete(dbInstance: Conn): Promise<WriteResult> {
    return storage.acl.delete(dbInstance, this.id);
  }

  isValid(): boolean {
    return true;
  }

  isRoleAllowed(group: UserEnums.Role): boolean {
    return (
      this.roles &&
      !!this.roles.length &&
      (this.roles.indexOf("*" as UserEnums.Role) !== -1 ||
        this.roles.indexOf(group) !== -1)
    );
  }

  static async findByRoute(
    dbInstance: Conn | undefined,
    controller: string,
    method: HttpMethods,
    route: string
  ): Promise<AclPermission[]> {
    const data = await storage.acl.byRoute(dbInstance as Conn, controller, method, route);

    return data.map((d) => new AclPermission(d));
  }

  static async findById(
    dbInstance: Conn | undefined,
    id: string
  ): Promise<AclPermission | null> {
    const data = await storage.acl.get(dbInstance as Conn, id);

    if (!data) {
      return null;
    }
    return new AclPermission(data);
  }

  static async fetchAll(
    dbInstance: Conn | undefined
  ): Promise<IResponsePermission[]> {
    return storage.acl.all(dbInstance as Conn);
  }
}
