import AclPermission from "@models/acl_permission";
import User from "@models/user";
import { CustomError, PermissionDeniedError } from "@shared/types/errors";
import { Response, Request, NextFunction, Router } from "express";

export const permissionDeniedErr = new PermissionDeniedError("");

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
    const method = methodParts[0] == "" ? methodParts[1] : methodParts[0];

    const permission = await AclPermission.findByPath(
      req.db.connection,
      ctrl,
      method
    );

    if (!permission) {
      const newPermission = new AclPermission({
        controller: ctrl,
        method,
        roles: [],
      });
      await newPermission.save(req.db.connection);
      console.log(`[Acl]: creating entry for ${ctrl}-${method}`);
    }

    return permission;
  }

  public async validate(req: Request): Promise<CustomError | null> {
    if (!req.userId) {
      return permissionDeniedErr;
    }

    const user = await User.getUser(req.db.connection, req.userId);

    const permission = await this.getPermission(req);
    if (user.role !== "admin" && !permission?.isRoleAllowed(user.role)) {
      return permissionDeniedErr;
    }

    return null;
  }
}

export default Acl;
