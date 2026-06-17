import AclPermission from "@models/acl/acl_permission";
import { HttpMethods, UserEnums } from "@inkvisitor/shared/enums";
import { CustomError, PermissionDeniedError } from "@inkvisitor/shared/types/errors";
import { Response, Request, NextFunction, Router } from "express";
import { IRequest } from "src/custom_typings/request";

export const permissionDeniedErr = new PermissionDeniedError(
  "Endpoint not allowed"
);

interface RouterLayer {
  stack: RouterLayer[];
}

class Acl {
  cachedRoutes: Record<string, Record<string, any>> = {};

  layers: RouterLayer[] = [];

  constructor() {
    this.authorize = this.authorize.bind(this);
    return;
  }

  public assignRoutes(router: Router): void {
    this.layers = router.stack as unknown as RouterLayer[];
  }

  public authorize(req: Request, res: Response, next: NextFunction): void {
    req.acl = this;
    next();
  }

  /**
   * Returns Acl entries that match current route.
   * If route does not exist, it is created with empty roles field and then returned as a match.
   * @param req
   * @returns
   */
  private async getPermissions(req: IRequest): Promise<AclPermission[]> {
    const controller = req.baseUrl.split("/").pop() || "";
    const route = req.route.path
      .split("/")
      .filter((part) => !!part)
      .join("/");
    const method = req.method as HttpMethods;

    const permissions = await AclPermission.findByRoute(
      req.db.connection,
      controller,
      method,
      route
    );

    if (!permissions.length) {
      // if permission does not exist yet, create one that only admin can access
      const newPermission = new AclPermission({
        controller,
        route,
        method,
        roles: [],
        public: false,
      });
      await newPermission.save(req.db.connection);
      permissions.push(newPermission);
    }

    return permissions;
  }

  /**
   * Determine if the request should be blocked or allowed.
   * Block is represented by returned PermissionDeniedError error.
   * @param req
   * @returns
   */
  public async validate(req: IRequest): Promise<CustomError | null> {
    const permissions = await this.getPermissions(req);
    const controller = req.baseUrl.split("/").pop() || "";
    const route = req.route.path
      .split("/")
      .filter((part) => !!part)
      .join("/");
    const method = req.method as HttpMethods;

    // allow public routes for all
    if (permissions.find((p) => p.public)) {
      return null;
    }

    // allow signout without an authenticated session
    if (
      controller === "users" &&
      route === "signout" &&
      method === HttpMethods.Post
    ) {
      return null;
    }

    // block not logged visitors
    if (!req.user) {
      return permissionDeniedErr;
    }

    const user = req.getUserOrFail();

    // allow editors with assigned rights to fetch users for filters (editedBy/updatedBy)
    if (
      controller === "users" &&
      route === "" &&
      method === HttpMethods.Get &&
      user.role === UserEnums.Role.Editor &&
      (user.rights?.length || 0) > 0
    ) {
      return null;
    }

    // allow admin/owner for any route
    if (user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin])) {
      return null;
    }

    // allow if current role is in permissions
    if (permissions.find((p) => p.isRoleAllowed(user.role))) {
      return null;
    }

    // block otherwise
    return permissionDeniedErr;
  }
}

export default Acl;
