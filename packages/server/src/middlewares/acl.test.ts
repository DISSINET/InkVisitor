import http from "http";
import { AddressInfo } from "net";
import express, { Request, RequestHandler, Response } from "express";
import { UserEnums } from "@inkvisitor/shared/enums";
import AclPermission from "@models/acl/acl_permission";
import User from "@models/user/user";
import { engineRoute } from "@modules/geocoding";
import { asyncRouteHandler } from "@modules/index";
import { IRequest } from "src/custom_typings/request";
import server from "../server";
import Acl, { aclGuard, permissionDeniedErr } from "./acl";
import errorsMiddleware from "./errors";

const { Admin, Editor, Viewer } = UserEnums.Role;

// a request as Acl.validate sees it inside a route; no role = not logged in
const request = (
  controller: string,
  method: string,
  path: string,
  role?: UserEnums.Role
): IRequest =>
  ({
    db: { connection: {} },
    user: role ? { user: { id: "u1" } } : undefined,
    getUserOrFail: () => new User({ id: "u1", role }),
    baseUrl: `/api/v1/${controller}`,
    method,
    route: { path },
  } as unknown as IRequest);

const row = (data: Partial<AclPermission>) =>
  new AclPermission({ id: "row-1", roles: [], ...data });

interface Layer {
  name: string;
  regexp: RegExp;
  handle: RequestHandler & { stack: Layer[] };
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: { handle: RequestHandler }[];
  };
}

interface MountedRoute {
  label: string;
  controller: string;
  method: string;
  path: string;
  handler: RequestHandler;
}

// Every route under the api router, once: the router is mounted on two paths.
// Express keeps a mount path only as a pattern, ^\/users\/?(?=\/|$).
const mountedRoutes = (): MountedRoute[] => {
  const seen = new Set<unknown>();
  const routes: MountedRoute[] = [];
  const walk = (stack: Layer[], controller: string) => {
    for (const layer of stack) {
      if (layer.name === "router") {
        const mount = layer.regexp.source.match(/^\^\\\/([\w-]+)/);
        walk(layer.handle.stack, mount ? mount[1] : "");
      } else if (layer.route && controller && !seen.has(layer.route)) {
        seen.add(layer.route);
        for (const verb of Object.keys(layer.route.methods)) {
          const method = verb.toUpperCase();
          const path = layer.route.path;
          routes.push({
            label: `${controller} ${method} ${path}`,
            controller,
            method,
            path,
            handler: layer.route.stack[0].handle,
          });
        }
      }
    }
  };
  walk((server as unknown as { _router: { stack: Layer[] } })._router.stack, "");
  // /health sits in front of acl.authorize and answers anyone
  return routes.filter((route) => route.label !== "api GET /health");
};

const routes = mountedRoutes();

describe("the mounted routes", () => {
  it("are found", () => {
    expect(routes.length).toBeGreaterThan(50);
  });

  it("all take the ACL check before their handler runs", async () => {
    const unguarded: string[] = [];
    for (const route of routes) {
      const validate = jest.fn().mockResolvedValue(permissionDeniedErr);
      const next = jest.fn();
      try {
        await route.handler(
          { acl: { validate } } as unknown as Request,
          {} as Response,
          next
        );
      } catch {
        // a handler with no check fails on the bare request
      }
      if (
        validate.mock.calls.length !== 1 ||
        next.mock.calls[0]?.[0] !== permissionDeniedErr
      ) {
        unguarded.push(route.label);
      }
    }
    expect(unguarded).toEqual([]);
  });
});

describe("Acl.validate", () => {
  const acl = new Acl();
  let findByRoute: jest.SpyInstance;
  let save: jest.SpyInstance;

  beforeEach(() => {
    findByRoute = jest.spyOn(AclPermission, "findByRoute").mockResolvedValue([]);
    save = jest.spyOn(AclPermission.prototype, "save").mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ["documents", "GET", "/"],
    ["documents", "POST", "/export"],
    ["stats", "POST", "/materialized"],
    ["saved-queries", "PUT", "/:id"],
    ["geocoding", "GET", "/search"],
    ["users", "GET", "/simplified"],
    ["entities", "POST", "/batch"],
    ["entities", "POST", "/query"],
    ["entities", "GET", "/:entityId/tooltip"],
    ["entities", "GET", "/:entityId/detail"],
    ["entities", "GET", "/:entityId/used-relations"],
    ["entities", "GET", "/:entityId/expansion"],
  ])(
    "allows a logged-in user on %s %s %s without reading or creating a row",
    async (controller, method, path) => {
      expect(
        await acl.validate(request(controller, method, path, Viewer))
      ).toBeNull();
      expect(findByRoute).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    }
  );

  // documents, stats, saved-queries and geocoding are open as whole
  // controllers; anywhere else a route is open one by one
  it("opens no other route to every logged-in user than the listed ones", async () => {
    const open: string[] = [];
    for (const route of routes) {
      findByRoute.mockClear();
      await acl.validate(
        request(route.controller, route.method, route.path, Viewer)
      );
      if (!findByRoute.mock.calls.length) {
        open.push(route.label);
      }
    }

    const whole = ["documents", "stats", "saved-queries", "geocoding"];
    expect(
      open.filter((label) => !whole.includes(label.split(" ")[0])).sort()
    ).toEqual([
      "entities GET /:entityId/detail",
      "entities GET /:entityId/expansion",
      "entities GET /:entityId/tooltip",
      "entities GET /:entityId/used-relations",
      "entities POST /batch",
      "entities POST /query",
      "users GET /simplified",
    ]);
  });

  it("does not allow the session of a deleted user on such a route", async () => {
    const req = request("documents", "GET", "/", Viewer);
    const err = new Error("User is required for the action, but not set");
    req.getUserOrFail = () => {
      throw err;
    };

    await expect(acl.validate(req)).rejects.toBe(err);
    expect(findByRoute).not.toHaveBeenCalled();
  });

  it("reads the row for a visitor on such a route: denied, unless the row is public", async () => {
    expect(await acl.validate(request("documents", "GET", "/"))).toBe(
      permissionDeniedErr
    );
    expect(findByRoute).toHaveBeenCalledTimes(1);

    findByRoute.mockResolvedValue([row({ public: true })]);
    expect(await acl.validate(request("documents", "GET", "/"))).toBeNull();
  });

  it("leaves entities POST query-export to its row", async () => {
    findByRoute.mockResolvedValue([row({ roles: [Admin] })]);
    expect(
      await acl.validate(request("entities", "POST", "/query-export", Editor))
    ).toBe(permissionDeniedErr);
    expect(findByRoute).toHaveBeenCalledWith(
      expect.anything(),
      "entities",
      "POST",
      "query-export"
    );
  });

  it("creates a roles: [] row for a route with none, which only the admin and owner bypass passes", async () => {
    expect(
      await acl.validate(request("backups", "GET", "/download", Admin))
    ).toBeNull();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.instances[0]).toMatchObject({
      controller: "backups",
      method: "GET",
      route: "download",
      roles: [],
      public: false,
    });

    expect(
      await acl.validate(request("backups", "GET", "/download", Editor))
    ).toBe(permissionDeniedErr);
  });

  it("decides by the row another request created when its own insert fails", async () => {
    findByRoute
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([row({ roles: [Editor] })]);
    save.mockRejectedValue(new Error("duplicate key value"));

    expect(
      await acl.validate(request("backups", "GET", "/download", Editor))
    ).toBeNull();
    expect(findByRoute).toHaveBeenCalledTimes(2);
    expect(findByRoute).toHaveBeenLastCalledWith(
      expect.anything(),
      "backups",
      "GET",
      "download"
    );
  });

  it("fails with the insert's error when the route still has no row after it", async () => {
    const err = new Error("connection lost");
    save.mockRejectedValue(err);

    await expect(
      acl.validate(request("backups", "GET", "/download", Editor))
    ).rejects.toBe(err);
  });
});

describe("a check that fails", () => {
  const err = new Error("acl_permissions unreachable");
  const failing = { validate: () => Promise.reject(err) } as unknown as Acl;
  // every shape a route takes the check in
  const routes: Record<string, RequestHandler> = {
    "/json": asyncRouteHandler(async () => ({ reached: true })),
    "/engine": engineRoute(async (_req, res) => {
      res.json({ reached: true });
    }),
    "/raw": aclGuard((_req, res) => {
      res.json({ reached: true });
    }),
  };
  let server: http.Server;
  let url: string;

  beforeAll(async () => {
    const app = express().use((req, _res, next) => {
      req.acl = failing;
      next();
    });
    for (const [path, handler] of Object.entries(routes)) {
      app.get(path, handler);
    }
    app.use(errorsMiddleware);
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  // the errors middleware logs an error that is not a CustomError
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(Object.keys(routes))("answers 500 on %s", async (path) => {
    // express 4 never answers a request whose handler promise rejected
    const r = await fetch(url + path, { signal: AbortSignal.timeout(2000) });
    expect(r.status).toBe(500);
    expect((await r.json()).error).toBe("InternalServerError");
  });

  // Express drops the promise a handler returns, so one that rejects is an
  // unhandled rejection. It is asserted on the promise itself: a listener for
  // the process event never fires inside a jest test.
  it.each(Object.keys(routes))(
    "hands the error to next on %s and does not reject",
    async (path) => {
      const next = jest.fn();
      await expect(
        routes[path]({ acl: failing } as Request, {} as Response, next)
      ).resolves.toBeUndefined();
      expect(next).toHaveBeenCalledWith(err);
    }
  );
});

describe("aclGuard", () => {
  const handler = jest.fn();
  const res = {} as Response;

  beforeEach(() => handler.mockReset());

  it("hands a denial to next and does not run the handler", async () => {
    const acl = { validate: async () => permissionDeniedErr } as unknown as Acl;
    const next = jest.fn();
    await aclGuard(handler)({ acl } as Request, res, next);
    expect(next).toHaveBeenCalledWith(permissionDeniedErr);
    expect(handler).not.toHaveBeenCalled();
  });

  it("runs the handler when the check allows, and when no check is mounted", async () => {
    const acl = { validate: async () => null } as unknown as Acl;
    const next = jest.fn();
    const req = { acl } as Request;
    await aclGuard(handler)(req, res, next);
    await aclGuard(handler)({} as Request, res, next);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});
