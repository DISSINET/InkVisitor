import AclPermission from "@models/acl/acl_permission";
import { CustomError, PermissionDeniedError } from "@shared/types/errors";
import { Response, Request, NextFunction, Router } from "express";

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
    this.layers = router.stack as RouterLayer[];
  }

  public authorize(req: Request, res: Response, next: NextFunction): void {
    req.acl = this;
    next();
  }

  private async getPermission(req: Request): Promise<AclPermission | null> {
    const ctrl = req.baseUrl.split("/").pop() || "";
    const methodParts = req.route.path.split("/");
    const route = methodParts[0] == "" ? methodParts[1] : methodParts[0];

    const permission = await AclPermission.findByRoute(
      req.db.connection,
      ctrl,
      route
    );

    if (!permission) {
      const newPermission = new AclPermission({
        controller: ctrl,
        route: route,
        roles: [],
      });
      await newPermission.save(req.db.connection);
      console.log(`[Acl]: creating entry for ${ctrl}/${route}`);
    }

    return permission;
  }

  public async validate(req: Request): Promise<CustomError | null> {
    const permission = await this.getPermission(req);
    console.log(permission);
    if (
      permission?.route === "signin" ||
      permission?.route === "active" ||
      permission?.route === "password"
    ) {
      return null;
    }

    if (!req.user) {
      return permissionDeniedErr;
    }

    if (
      req.user.user.role !== "admin" &&
      !permission?.isRoleAllowed(req.user.user.role)
    ) {
      return permissionDeniedErr;
    }

    return null;
  }
}

export default Acl;
