import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { successfulGenericResponse } from "../common.test";
import User from "@models/user/user";
import { Db } from "@service/rethink";
import { checkPassword } from "@common/auth";
import { r } from "rethinkdb-ts";
import { pool } from "@middlewares/db";
import {
  createAgentWithUserId,
  getAuthenticatedAgent,
} from "@modules/testAuth";

describe("Users update", function () {
  let db: Db;
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;
  const updateUser = new User({
    email: `user${Math.random()}}`,
    active: true,
    verified: true,
    name: `user${Math.random()}}`,
  });

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
    await updateUser.save(db.connection);
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/users/update/1`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("faulty data ", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/users/update/1`)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("not existing user ", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/users/update/2132312323`)
        .send({ email: "123" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        );
    });
  });

  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      await authAgent
        .put(`${apiPath}/users/update/1`)
        .send({ email: `admin${Math.random()}@admin.com` })
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200);
    });
  });
  describe("password data", () => {
    it("should fail if attempting to update non-owned user", async () => {
      const data = await authAgent
        .get(`${apiPath}/users/me`)
        .expect("Content-Type", /json/);

      const adminId = data.body.id;
      const newPassword = "test" + Math.random().toFixed();
      const viewerAgent = await createAgentWithUserId(updateUser.id);

      await viewerAgent
        .put(`${apiPath}/users/${adminId}`)
        .send({ password: newPassword })
        .expect("Content-Type", /json/)
        .expect(403);
    });
    it("should return a 200 code with successful response and update password", async () => {
      const newPassword = "test" + Math.random();

      await authAgent
        .put(`${apiPath}/users/${updateUser.id}`)
        .send({ password: newPassword })
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200);

      const userData = await r
        .table(User.table)
        .get(updateUser.id)
        .run(db.connection);

      expect(checkPassword(newPassword, userData?.password || "")).toBeTruthy();
      await db.close();
    });
  });
});
