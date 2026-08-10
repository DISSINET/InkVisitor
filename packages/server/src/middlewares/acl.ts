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

    // allow editors with assigned territory rights to fetch users for filters
    // (editedBy/updatedBy). Resource-annotate rights don't count here.
    if (
      controller === "users" &&
      route === "" &&
      method === HttpMethods.Get &&
      user.role === UserEnums.Role.Editor &&
      (user.rights?.filter((r) => r.mode !== UserEnums.RoleMode.Annotate)
        .length || 0) > 0
    ) {
      return null;
    }

    // The simplified user list (GET /users/simplified) returns only {id, name}
    // and is needed by any logged-in user for stats charts and explorer filters.
    if (
      controller === "users" &&
      route === "simplified" &&
      method === HttpMethods.Get
    ) {
      return null;
    }

    // Stats queries (POST /stats, POST /stats/materialized) are read-only
    // aggregations that any logged-in user may access.
    if (controller === "stats") {
      return null;
    }

    // Documents are governed by the route handlers, not the ACL table: any
    // logged-in user may GET (view) any document, while update/delete/export/
    // removeAnchor are gated per-resource inside the handlers
    // (userCanManageDocument: Owner/Admin, or Editor assigned to the linked
    // Resource). This also avoids the auto-created roles:[] permission that the
    // ACL layer persists for routes lacking an explicit entry.
    if (controller === "documents") {
      return null;
    }

    // Saved queries (Explorer page) intentionally have no seeded ACL entries —
    // the coarse ACL table cannot express their per-resource rules, so access is
    // gated inside the handlers: any logged-in user may list/create private
    // queries and moderate their own; sharing and moderating shared queries is
    // restricted to Admin/Owner.
    if (controller === "saved-queries") {
      return null;
    }

    // The entities batch read (POST /entities/batch) is the bulk equivalent of
    // the public GET /entities/:entityId; it backs e.g. fetching the entities
    // behind a document's anchors. Allow it for any logged-in user (it has no
    // seeded ACL entry, so it would otherwise be auto-denied to non-admins).
    if (
      controller === "entities" &&
      route === "batch" &&
      method === HttpMethods.Post
    ) {
      return null;
    }

    // POST /entities/query backs the Explorer results for everyone and has no
    // seeded ACL entry. Read-only; mutations are still governed by the
    // individual entity endpoints.
    // query-export is deliberately NOT included: bulk TSV export is offered
    // only to Admin/Owner in the Explorer, and the handler has no role check of
    // its own, so it is left to its acl_permissions row.
    if (
      controller === "entities" &&
      route === "query" &&
      method === HttpMethods.Post
    ) {
      return null;
    }

    // GET /entities/:entityId/tooltip and GET /entities/:entityId/detail have
    // no seeded ACL entries. Both are read-only companions to the public
    // GET /entities/:entityId. Any logged-in user may call them; entity-level
    // access is handled inside each handler.
    if (
      controller === "entities" &&
      (route.endsWith("/tooltip") || route.endsWith("/detail")) &&
      method === HttpMethods.Get
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
