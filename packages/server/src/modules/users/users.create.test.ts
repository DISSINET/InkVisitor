import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { successfulGenericResponse } from "@modules/common.test";
import { supertestConfig } from "..";
import { Db } from "@service/rethink";
import User from "@models/user/user";
import { deleteUser, deleteUsers } from "@service/shorthands";

describe("Users create", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data ", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/users`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
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

      const createdUser = await User.findUserByLabel(db.connection, email);
      expect(createdUser).toBeTruthy();
      expect(createdUser?.active).toEqual(true);
    });
  });
});
