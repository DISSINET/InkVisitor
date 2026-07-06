import { clean, testErroneousResponse } from "@modules/common.test";
import { UserNotActiveError } from "@inkvisitor/shared/types/errors";
import { apiPath } from "@common/constants";
import { Db } from "@service/rethink";
import User from "@models/user/user";
import { createAgentWithUserId } from "@modules/testAuth";
import { pool } from "./db";
import { UserEnums } from "@inkvisitor/shared/enums";

describe("Test valid/invalid user", function () {
  const db = new Db();
  // Owner role so the active user passes the ACL layer (GET /users/me has no
  // seeded public ACL entry, so non-privileged roles are auto-denied); this
  // test only asserts the active/inactive request-middleware behavior.
  const activeUser = new User({
    email: "active@active.com",
    name: "active",
    active: true,
    verified: true,
    role: UserEnums.Role.Owner,
  });
  const inactiveUser = new User({
    email: "inactive@inactive.com",
    name: "inactive",
    active: false,
    verified: true,
  });

  beforeAll(async () => {
    await db.initDb();
    await activeUser.save(db.connection);
    await inactiveUser.save(db.connection);
  });

  afterAll(async () => {
    await activeUser.delete(db.connection);
    await inactiveUser.delete(db.connection);
    await clean(db);
    await pool.end();
  });

  it("should return a 200 response for active user", async () => {
    const agent = await createAgentWithUserId(activeUser.id);
    await agent.get(`${apiPath}/users/me`).expect(200);
  });

  it("should return a UserNotActiveError error wrapped in IResponseGeneric for inactive user", async () => {
    const agent = await createAgentWithUserId(inactiveUser.id);
    await agent
      .get(`${apiPath}/users/me`)
      .expect(
        testErroneousResponse.bind(undefined, new UserNotActiveError("", ""))
      );
  });
});
