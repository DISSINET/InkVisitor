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
    const testUserId = Math.random().toString();
    const db = new Db();

    beforeAll(async () => {
      await db.initDb();

      const user = new User({ id: testUserId });
      await user.save(db.connection);
    })

    it("should return a 200 code with successful response", async () => {
      await request(app)
        .delete(`${apiPath}/users/${testUserId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200);
    });

    it("should not return this user after delete operation", async () => {
      const user = await User.findUserById(db.connection, testUserId)
      expect(user).toBeNull();
    });
  });
});
