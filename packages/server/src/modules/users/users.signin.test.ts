import { testErroneousResponse } from "@modules/common.test";
import { BadCredentialsError, BadParams } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { pool } from "@middlewares/db";
import { Db, storage } from "@service/storage";

describe("Users signin", function () {
  // The ephemeral test DB seeds no acl_permissions, so the otherwise-public
  // /users/signin route would be auto-denied (403). Seed the public permission
  // the production dataset normally provides so the handler is reachable.
  beforeAll(async () => {
    const db = new Db();
    await db.initDb();
    await storage.acl.insert(db.connection, {
        controller: "users",
        method: "POST",
        route: "signin",
        roles: [],
        public: true,
      });
    // Another suite (users.password) mutates the seeded admin's password and
    // does not restore it; reset it here so this signin assertion is
    // independent of test execution order.
    const admin = await storage.users.byLogin(db.connection, "admin", true);
    if (admin) {
      await storage.users.update(db.connection, admin.id, { password: "admin" });
    }
    await db.close();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Empty body", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/users/signin`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Ok body with faulty params ", () => {
    // The signin handler now reads `login` (not `username`) and responds with
    // BadCredentialsError (401) for an unknown login, instead of UserDoesNotExits.
    it("should return a BadCredentialsError wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/users/signin`)
        .send({ login: "fake", password: "fake" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new BadCredentialsError(""))
        );
    });
  });
  describe("Ok body with ok user", () => {
    it("should return a 200 code with successful response", async () => {
      const res = await request(app)
        .post(`${apiPath}/users/signin`)
        .send({ login: "admin", password: "admin" })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(res.body).toBeTruthy();
      expect(typeof res.body).toBe("object");
      expect(res.body.id).toBeTruthy();
    });
  });
});
