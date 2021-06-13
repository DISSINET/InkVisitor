import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import {
  createActant,
  createUser,
  getActantUsage,
} from "../../service/shorthands";
import { Db } from "@service/RethinkDB";
import Statement from "@models/statement";
import { supertestConfig } from "..";

describe("Users bookmarksGet", function () {
  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/users/bookmarksGet`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Wrong param", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/users/bookmarksGet/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new UserDoesNotExits("")))
        .then(() => done());
    });
  });
  describe("Correct param with nonexistent actant", () => {
    it("should return a 200 code with empty array of bookmarks", async (done) => {
      const db = new Db();
      await db.initDb();
      const testUserId = Math.random().toString();
      await createUser(db, {
        id: testUserId,
        name: "test",
        email: "test@test.test",
        password: "test",
        bookmarks: [], // empty array of mookmarks
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
        .get(`${apiPath}/users/bookmarksGet/${testUserId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys("bookmarks");
          res.body.bookmarks.should.be.a("array");
          res.body.bookmarks.should.have.lengthOf(0);
        })
        .expect(200, done);
    });
  });
  describe("Correct param with existing actant", () => {
    it("should return a 200 code with non-empty array of bookmarks", async (done) => {
      const db = new Db();
      await db.initDb();
      const testId = Math.random().toString();

      await createActant(
        db,
        new Statement({ id: testId, data: { territory: { id: "any" } } })
      );
      await createUser(db, {
        id: testId,
        name: "test",
        email: "test@test.test",
        password: "test",
        bookmarks: [
          {
            name: "test",
            actantIds: [testId], // this id should exist in actants
          },
        ],
        role: "1",
        storedTerritories: [],
        rights: [],
        options: {
          defaultLanguage: "",
          defaultTerritory: "",
          searchLanguages: [],
        },
      });

      const bookmarkCountUsage = await getActantUsage(db, testId);
      request(app)
        .get(`${apiPath}/users/bookmarksGet/${testId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys("bookmarks");
          res.body.bookmarks.should.be.a("array");
          res.body.bookmarks.should.have.lengthOf(1);
          res.body.bookmarks[0].actants.should.have.lengthOf(1);
          expect(res.body.bookmarks[0].actants[0].usedCount).toEqual(
            bookmarkCountUsage
          );
        })
        .expect(200, done);
    });
  });
});
