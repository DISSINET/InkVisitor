import { CustomError, PermissionDeniedError } from "@shared/types/errors";
import { Response, Request, NextFunction, Router } from "express";

export const permissionDeniedErr = new PermissionDeniedError("");

class Acl {
  cachedRoutes: Record<string, any> = {};

  layers: any[] = [];

  constructor() {
    this.authorize = this.authorize.bind(this);
    return;
  }

  public assignRoutes(router: Router) {
    this.layers = router.stack;
  }

  public authorize(req: Request, res: Response, next: NextFunction): void {
    req.acl = this;
    next();
  }

  public async getError(req: Request): Promise<CustomError> {
    return permissionDeniedErr;
  }
}

export default Acl;
