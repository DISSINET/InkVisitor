import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { successfulGenericResponse } from "../common.test";
import { supertestConfig } from "..";
import User from "@models/user/user";
import { Db } from "@service/rethink";
import { checkPassword, generateAccessToken } from "@common/auth";
import { r } from "rethinkdb-ts";
import { pool } from "@middlewares/db";

describe("Users update", function () {
  let db: Db;
  const updateUser = new User({
    email: `user${Math.random()}}`,
    active: true,
    name: `user${Math.random()}}`,
  });

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
    await updateUser.save(db.connection);
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .put(`${apiPath}/users/update/1`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("faulty data ", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .put(`${apiPath}/users/update/1`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("not existing user ", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .put(`${apiPath}/users/update/2132312323`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ email: "123" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        );
    });
  });

  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      await request(app)
        .put(`${apiPath}/users/update/1`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ email: `admin${Math.random()}@admin.com` })
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200);
    });
  });
  describe("password data", () => {
    it("should fail if attempting to update non-owned user", async () => {
      const data = await request(app)
        .get(`${apiPath}/users/me`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/);

      const adminId = data.body.id;
      const newPassword = "test" + Math.random().toFixed();
      const viewerAccessToken = generateAccessToken(updateUser);

      await request(app)
        .put(`${apiPath}/users/${adminId}`)
        .set("authorization", "Bearer " + viewerAccessToken)
        .send({ password: newPassword })
        .expect("Content-Type", /json/)
        .expect(403);
    });
    it("should return a 200 code with successful response and update password", async () => {
      const newPassword = "test" + Math.random();

      await request(app)
        .put(`${apiPath}/users/${updateUser.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
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
