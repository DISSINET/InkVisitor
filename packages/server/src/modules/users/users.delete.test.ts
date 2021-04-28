import "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { createUser } from "../../service/shorthands";
import {
  successfulGenericResponse,
  faultyGenericResponse,
} from "../common.test";

describe("Users delete", function () {
  describe("empty data", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .delete(`${apiPath}/users/delete`)
        .expect("Content-Type", /json/)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("faulty data", () => {
    it("should return a 200 code with unsuccessful message", (done) => {
      return request(app)
        .delete(`${apiPath}/users/delete/randomid12345`)
        .expect("Content-Type", /json/)
        .expect(faultyGenericResponse)
        .expect(200, done);
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
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200, done);
    });
  });
});
