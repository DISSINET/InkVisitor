import { testErroneousResponse } from "@modules/common.test";
import { ModelNotValidError } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { successfulGenericResponse } from "@modules/common.test";
import { supertestConfig } from "..";
import { Db } from "@service/rethink";
import User from "@models/user/user";
import { deleteUsers } from "@service/shorthands";
import { pool } from "@middlewares/db";

describe("Users create", function () {
  afterAll(async () => {
    await pool.end();
  });

  // The create handler now constructs a User and rejects an invalid model with
  // ModelNotValidError (400) instead of the previous BadParams gate.
  describe("empty data", () => {
    it("should return a ModelNotValidError wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("faulty data ", () => {
    it("should return a ModelNotValidError wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("ok data", () => {
    const db = new Db();

    beforeAll(async () => {
      await db.initDb();
    });

    afterAll(async () => {
      await deleteUsers(db);
      await db.close();
    });

    it("should return a 200 code with successful response", async () => {
      const email = `${Math.random()}@dissinet.cz`;
      await request(app)
        .post(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ name: "tester", email: email, password: "pass" })
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200);

      const createdUser = await User.findUserByLogin(db, email, false);
      expect(createdUser).toBeTruthy();
      // The create handler forces active=false; the user becomes active only
      // after completing the emailed activation flow.
      expect(createdUser?.active).toEqual(false);
    });
  });
});
