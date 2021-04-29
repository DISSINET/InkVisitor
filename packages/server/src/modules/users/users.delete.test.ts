import "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { createUser } from "../../service/shorthands";
import {
  successfulGenericResponse,
  testErroneousResponse,
} from "../common.test";
import { supertestConfig } from "..";

describe("Users delete", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .delete(`${apiPath}/users/delete`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data", () => {
    it("should return a 200 code with unsuccessful message", (done) => {
      return request(app)
        .delete(`${apiPath}/users/delete/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new UserDoesNotExits("")))
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const db = new Db();
      await db.initDb();
      const testUserId = Math.random().toString();
      await createUser(db, {
        id: testUserId,
        name: "test",
        email: "test@test.test",
        password: "test",
        bookmarks: [],
        role: "1",
        storedTerritories: [],
        rights: [],
        options: {
          defaultLanguage: "",
          defaultTerritory: "",
          searchLanguages: [],
        },
      });

      request(app)
        .delete(`${apiPath}/users/delete/${testUserId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200, done);
    });
  });
});
