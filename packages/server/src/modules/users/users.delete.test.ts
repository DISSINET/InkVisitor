import "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import { Db } from "@service/rethink";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import {
  successfulGenericResponse,
  testErroneousResponse,
} from "../common.test";
import { supertestConfig } from "..";
import User from "@models/user/user";
import { pool } from "@middlewares/db";

describe("Users delete", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .delete(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("faulty data", () => {
    it("should return a 200 code with unsuccessful message", async () => {
      await request(app)
        .delete(`${apiPath}/users/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        );
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      const db = new Db();
      await db.initDb();
      const testUserId = Math.random().toString();

      const user = new User({ id: testUserId });
      await user.save(db.connection);

      await request(app)
        .delete(`${apiPath}/users/${testUserId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200);
    });
  });
});
