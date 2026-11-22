import { apiPath } from "@common/constants";
import { HttpMethods, UserEnums } from "@inkvisitor/shared/enums";
import { permissionDeniedErr } from "@middlewares/acl";
import { pool } from "@middlewares/db";
import AclPermission from "@models/acl/acl_permission";
import User from "@models/user/user";
import { AuthAgent, createAgentWithUserId } from "../test/testAuth";
import { Db, storage } from "@service/storage";

// acl_permissions holds one row per route on PostgreSQL only
// (acl_permissions_route_key); RethinkDB stores a second row for the route
const itPg = storage.kind === "postgres" ? it : it.skip;

describe("acl on the mounted routes", () => {
  const db = new Db();
  const viewer = new User({
    id: `viewer-${Math.random()}`,
    name: `viewer-${Math.random()}`,
    email: `viewer-${Math.random()}@test.com`,
    password: "viewer",
    active: true,
    verified: true,
    role: UserEnums.Role.Viewer,
  });
  let viewerAgent: AuthAgent;
  let adminAgent: AuthAgent;

  const { Get } = HttpMethods;
  const rowsOf = (controller: string, method: HttpMethods, route: string) =>
    storage.acl.byRoute(db.connection, controller, method, route);
  const dropRows = async (
    controller: string,
    method: HttpMethods,
    route: string
  ) =>
    storage.acl.deleteMany(
      db.connection,
      (await rowsOf(controller, method, route)).map((row) => row.id)
    );

  beforeAll(async () => {
    await db.initDb();
    await viewer.save(db.connection);
    viewerAgent = await createAgentWithUserId(viewer.id);
    adminAgent = await createAgentWithUserId("1");
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ["documents", "", "/documents"],
    ["users", "simplified", "/users/simplified"],
    ["geocoding", "health", "/geocoding/health"],
  ])(
    "serves a logged-in viewer GET %s '%s' and stores no row for it",
    async (controller, route, path) => {
      await dropRows(controller, Get, route);
      await viewerAgent.get(apiPath + path).expect(200);
      expect(await rowsOf(controller, Get, route)).toEqual([]);
    }
  );

  it("gives backups GET download its row on the first call, which denies every role but admin and owner", async () => {
    await dropRows("backups", Get, "download");

    const res = await viewerAgent.get(`${apiPath}/backups/download`).expect(403);
    expect(res.body.message).toBe(permissionDeniedErr.message);
    expect(await rowsOf("backups", Get, "download")).toMatchObject([
      { roles: [], public: false },
    ]);

    await dropRows("backups", Get, "download");
  });

  it("answers each of several first requests to a route with no row", async () => {
    const burst = () =>
      Promise.all(
        Array.from({ length: 8 }, () => adminAgent.get(`${apiPath}/users/me`))
      );
    // the requests only overlap between the read and the insert when each
    // finds an open connection: one that has to open its own arrives after
    // the first request has stored the row
    await burst();
    await dropRows("users", Get, "me");

    const responses = await burst();
    expect(responses.map((res) => res.status)).toEqual(Array(8).fill(200));

    const rows = await rowsOf("users", Get, "me");
    if (storage.kind === "postgres") {
      expect(rows).toHaveLength(1);
    } else {
      expect(rows.length).toBeGreaterThan(0);
    }

    await dropRows("users", Get, "me");
  });

  // the state of a request that lost the race: it read no row, and one is
  // there by the time it inserts its own
  itPg("decides by the stored row when its own insert is refused", async () => {
    await dropRows("users", Get, "me");
    await storage.acl.insert(db.connection, {
      controller: "users",
      method: Get,
      route: "me",
      roles: [UserEnums.Role.Viewer],
      public: false,
    });
    const findByRoute = jest
      .spyOn(AclPermission, "findByRoute")
      .mockResolvedValueOnce([]);

    await viewerAgent.get(`${apiPath}/users/me`).expect(200);

    expect(findByRoute).toHaveBeenCalledTimes(2);
    expect(await rowsOf("users", Get, "me")).toHaveLength(1);

    await dropRows("users", Get, "me");
  });
});
