import { clean, testErroneousResponse } from "@modules/common.test";
import { UserNotActiveError } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../Server";
import { Db } from "@service/rethink";
import User from "@models/user/user";
import { generateAccessToken } from "@common/auth";

describe("Test valid/invalid user", function () {
  const db = new Db();
  const activeUser = new User({
    email: "active@active.com",
    name: "active",
    active: true,
  });
  const inactiveUser = new User({
    email: "inactive@inactive.com",
    name: "inactive",
    active: false,
  });
  let activeUserToken: string;
  let inactiveUserToken: string;

  beforeAll(async () => {
    await db.initDb();
    await activeUser.save(db.connection);
    await inactiveUser.save(db.connection);
    activeUserToken = generateAccessToken(activeUser);
    inactiveUserToken = generateAccessToken(inactiveUser);
  });

  beforeEach(async () => {});

  afterAll(async () => {
    await activeUser.delete(db.connection);
    await inactiveUser.delete(db.connection);
    await clean(db);
  });

  it("should return a 200 response for active user", async () => {
    await request(app)
      .get(`${apiPath}/users/me`)
      .set("authorization", "Bearer " + activeUserToken)
      .expect(200);
  });

  it("should return a UserNotActiveError error wrapped in IResponseGeneric for inactive user", async () => {
    await request(app)
      .get(`${apiPath}/users/me`)
      .set("authorization", "Bearer " + inactiveUserToken)
      .expect(
        testErroneousResponse.bind(undefined, new UserNotActiveError("", ""))
      );
  });
});
