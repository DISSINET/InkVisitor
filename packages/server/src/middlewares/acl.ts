import AclPermission from "@models/acl/acl_permission";
import { HttpMethods, UserEnums } from "@inkvisitor/shared/enums";
import { CustomError, PermissionDeniedError } from "@inkvisitor/shared/types/errors";
import { Response, Request, NextFunction, RequestHandler } from "express";
import { IRequest } from "src/custom_typings/request";

export const permissionDeniedErr = new PermissionDeniedError(
  "Endpoint not allowed"
);

// Open to every logged-in user whatever acl_permissions holds: whole
// controllers here, single routes ("controller METHOD route") below.
const OPEN_CONTROLLERS = new Set([
  // read-only aggregations
  "stats",
  // any logged-in user may view any document; update, delete, export and
  // removeAnchor are gated per resource inside the handlers
  // (userCanManageDocument)
  "documents",
  // their per-resource rules are beyond the ACL table and are applied inside
  // the handlers
  "saved-queries",
  // the Geocoding page sits behind login only and the engine enforces its
  // own quota
  "geocoding",
]);

const OPEN_ROUTES = new Set([
  // only {id, name}, which stats charts and explorer filters need
  "users GET simplified",
  // the bulk equivalent of the public GET /entities/:entityId
  "entities POST batch",
  // backs the Explorer results; read-only. query-export is deliberately NOT
  // here: bulk TSV export is offered only to Admin/Owner and its handler has
  // no role check of its own, so it is left to its acl_permissions row.
  "entities POST query",
  // read-only companions to the public GET /entities/:entityId; entity-level
  // access, where there is any, is handled inside each handler
  "entities GET :entityId/tooltip",
  "entities GET :entityId/detail",
  "entities GET :entityId/used-relations",
  "entities GET :entityId/expansion",
  // the Geocoding page asks which entities come under each of the project's
  // location types; it reads classifications and the superclass and synonym
  // links between Concepts, which any logged-in user sees in a Concept's detail
  "entities GET classified-under",
]);

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
   * The acl_permissions rows of the route. A route with none gets a row with
   * no roles, which only the admin and owner bypass passes.
   */
  private async getPermissions(
    req: IRequest,
    controller: string,
    method: HttpMethods,
    route: string
  ): Promise<AclPermission[]> {
    const read = () =>
      AclPermission.findByRoute(req.db.connection, controller, method, route);

    const permissions = await read();
    if (permissions.length) {
      return permissions;
    }

    const created = new AclPermission({
      controller,
      route,
      method,
      roles: [],
      public: false,
    });
    try {
      await created.save(req.db.connection);
      return [created];
    } catch (err) {
      // PostgreSQL holds one row per route, so of several first requests
      // that all found none, one insert succeeds and the rest fail: those
      // decide by the row that is there
      const existing = await read();
      if (!existing.length) {
        throw err;
      }
      return existing;
    }
  }

  /**
   * Determine if the request should be blocked or allowed.
   * Block is represented by returned PermissionDeniedError error.
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
    if (
      req.user &&
      (OPEN_CONTROLLERS.has(controller) ||
        OPEN_ROUTES.has(`${controller} ${method} ${route}`))
    ) {
      // throws for a session of a deleted user, which resolves to no user
      req.getUserOrFail();
      return null;
    }

    const permissions = await this.getPermissions(
      req,
      controller,
      method,
      route
    );

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
 * inside a route. A denial, a check that fails and a handler that throws or
 * rejects all go to the errors middleware; Express 4 drops the promise a
 * handler returns, so a rejection left alone would end the process.
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
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };

export default Acl;
