import AclPermission from "@models/acl/acl_permission";
import { HttpMethods, UserEnums } from "@shared/enums";
import { CustomError, PermissionDeniedError } from "@shared/types/errors";
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
    this.layers = router.stack as RouterLayer[];
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
    const route = req.route.path.split("/").filter(part => !!part).join("/")
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

    // allow public routes for all
    if (permissions.find(p => p.public)) {
      return null;
    }

    // block not logged visitors
    if (!req.user) {
      return permissionDeniedErr;
    }

    // allow admin for any route
    if (req.getUserOrFail().role === UserEnums.Role.Admin) {
      return null;
    }

    // allow if current role is in permissions
    if (permissions.find(p => p.isRoleAllowed(req.getUserOrFail().role))) {
      return null;
    }

    // block otherwise
    return permissionDeniedErr;
  }
}

export default Acl;
