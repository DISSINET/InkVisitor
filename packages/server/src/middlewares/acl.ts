import Aco from "@models/acl_aco";
import AclPermission from "@models/acl_permission";
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
    const ctrl = req.baseUrl;
    const method = req.route.path;

    const permission = await AclPermission.findByPath(
      req.db.connection,
      ctrl,
      method
    );

    return permission;
  }

  public async validate(req: Request): Promise<CustomError | null> {
    if (!req.userId) {
      return permissionDeniedErr;
    }

    const permission = await this.getPermission(req);
    if (!permission?.isUserAllowed(req.userId)) {
      return permissionDeniedErr;
    }

    return null;
  }
}

export default Acl;
