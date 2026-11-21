import AclPermission from "@models/acl/acl_permission";
import { HttpMethods, UserEnums } from "@inkvisitor/shared/enums";
import { CustomError, PermissionDeniedError } from "@inkvisitor/shared/types/errors";
import { Response, Request, NextFunction, RequestHandler } from "express";
import { IRequest } from "src/custom_typings/request";

export const permissionDeniedErr = new PermissionDeniedError(
  "Endpoint not allowed"
);

/**
 * Routes open to every logged-in user whatever acl_permissions holds.
 */
function isOpenToLoggedIn(
  controller: string,
  route: string,
  method: HttpMethods
): boolean {
  // The simplified user list (GET /users/simplified) returns only {id, name}
  // and is needed by any logged-in user for stats charts and explorer filters.
  if (
    controller === "users" &&
    route === "simplified" &&
    method === HttpMethods.Get
  ) {
    return true;
  }

  // Stats queries (POST /stats, POST /stats/materialized) are read-only
  // aggregations that any logged-in user may access.
  if (controller === "stats") {
    return true;
  }

  // Documents are governed by the route handlers, not the ACL table: any
  // logged-in user may GET (view) any document, while update/delete/export/
  // removeAnchor are gated per-resource inside the handlers
  // (userCanManageDocument: Owner/Admin, or Editor assigned to the linked
  // Resource). This also avoids the auto-created roles:[] permission that the
  // ACL layer persists for routes lacking an explicit entry.
  if (controller === "documents") {
    return true;
  }

  // Saved queries (Explorer page) intentionally have no seeded ACL entries -
  // the coarse ACL table cannot express their per-resource rules, so access is
  // gated inside the handlers: any logged-in user may list/create private
  // queries and moderate their own; sharing and moderating shared queries is
  // restricted to Admin/Owner.
  if (controller === "saved-queries") {
    return true;
  }

  // Geocoding (HGA-Engine proxy) is open to any logged-in user: the Geocoding
  // page sits behind login only and the engine enforces its own quota. No
  // acl_permissions row is seeded, so this also keeps the auto-created
  // roles:[] row from denying every non-admin.
  if (controller === "geocoding") {
    return true;
  }

  // The entities batch read (POST /entities/batch) is the bulk equivalent of
  // the public GET /entities/:entityId; it backs e.g. fetching the entities
  // behind a document's anchors. Allow it for any logged-in user.
  if (
    controller === "entities" &&
    route === "batch" &&
    method === HttpMethods.Post
  ) {
    return true;
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
    return true;
  }

  // GET /entities/:entityId/tooltip, /detail, /used-relations and /expansion
  // are read-only companions to the public GET /entities/:entityId, so any
  // logged-in user may call them; entity-level access, where there is any, is
  // handled inside each handler.
  if (
    controller === "entities" &&
    (route.endsWith("/tooltip") ||
      route.endsWith("/detail") ||
      route.endsWith("/used-relations") ||
      route.endsWith("/expansion")) &&
    method === HttpMethods.Get
  ) {
    return true;
  }

  return false;
}

class Acl {
  constructor() {
    this.authorize = this.authorize.bind(this);
    return;
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
      // if permission does not exist yet, create one that only admin/owner can access
      const newPermission = new AclPermission({
        controller,
        route,
        method,
        roles: [],
        public: false,
      });
      try {
        await newPermission.save(req.db.connection);
      } catch (err) {
        // PostgreSQL holds one row per route, so of several first requests
        // that all found none, one insert succeeds and the rest fail: those
        // decide by the row that is there
        const existing = await AclPermission.findByRoute(
          req.db.connection,
          controller,
          method,
          route
        );
        if (!existing.length) {
          throw err;
        }
        return existing;
      }
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
    const controller = req.baseUrl.split("/").pop() || "";
    const route = req.route.path
      .split("/")
      .filter((part) => !!part)
      .join("/");
    const method = req.method as HttpMethods;

    // decided before the read, so a logged-in user costs these routes no
    // lookup and no row
    if (req.user && isOpenToLoggedIn(controller, route, method)) {
      // throws for a session of a deleted user, which resolves to no user
      req.getUserOrFail();
      return null;
    }

    const permissions = await this.getPermissions(req);

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

    // allow admin/owner for any route. The read above runs for them too, so a
    // route with no row gets one and shows up for role assignment.
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

/**
 * Puts the ACL check in front of the handler of one route. It wraps a route
 * and cannot sit on a router: Acl.validate reads req.route, which exists only
 * inside a route. A denial and a check that fails both go to the errors
 * middleware; Express 4 drops the promise a handler returns, so a check left
 * to reject would end the process as an unhandled rejection.
 */
export const aclGuard =
  (handler: RequestHandler): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const denied = req.acl ? await req.acl.validate(req) : null;
      if (denied) {
        next(denied);
        return;
      }
      // not awaited: a promise the handler returns stays the handler's to
      // settle, as when Express calls it
      handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };

export default Acl;
