import "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@inkvisitor/shared/types/errors";
import { Db } from "@service/rethink";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import {
  successfulGenericResponse,
  testErroneousResponse,
} from "../common.test";
import { getAuthenticatedAgent } from "@modules/testAuth";
import User from "@models/user/user";
import { pool } from "@middlewares/db";

describe("Users delete", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .delete(`${apiPath}/users`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("faulty data", () => {
    it("should return a 200 code with unsuccessful message", async () => {
      await authAgent
        .delete(`${apiPath}/users/randomid12345`)
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
      await authAgent
        .delete(`${apiPath}/users/${testUserId}`)
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
