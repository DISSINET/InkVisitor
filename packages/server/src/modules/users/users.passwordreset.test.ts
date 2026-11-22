import { testErroneousResponse } from "@modules/common.test";
import { UserDoesNotExits } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { pool } from "@middlewares/db";
import { Db } from "@service/rethink";
import User from "@models/user/user";
import { ensureSessionsTable } from "@service/rethinkSessionStore";
import { r } from "rethinkdb-ts";

describe("Users password reset", function () {
  const hash = `reset-${Math.random()}`;

  beforeAll(async () => {
    const db = new Db();
    await db.initDb();
    // the ephemeral test DB seeds no acl_permissions; the route is public in the datasets
    await r
      .table("acl_permissions")
      .insert({ controller: "users", method: "PUT", route: "password_reset", roles: [], public: true })
      .run(db.connection);
    // a reset logs the user out everywhere; the server creates this table at boot
    await ensureSessionsTable(db.connection);
    await new User({ name: `reset-${Math.random()}`, email: `reset-${Math.random()}@example.com`, hash }).save(
      db.connection
    );
    await db.close();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("sets the password once per link", async () => {
    const body = { password: "new-password", passwordRepeat: "new-password" };
    await request(app)
      .put(`${apiPath}/users/password_reset?hash=${hash}`)
      .send(body)
      .expect(200)
      .expect((res) => expect(res.body.result).toBe(true));

    await request(app)
      .put(`${apiPath}/users/password_reset?hash=${hash}`)
      .send(body)
      .expect(testErroneousResponse.bind(undefined, new UserDoesNotExits("", "")));
  });
});
