import { BadParams, UserDoesNotExits } from "@common/errors";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { createUser, getActantUsage } from "../../service/shorthands";
import { Db } from "@service/RethinkDB";

const should = chai.should();
const expect = chai.expect;

describe("Users bookmarksGet", function () {
  describe("Empty param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .get(`${apiPath}/users/bookmarksGet`)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Wrong param", () => {
    it("should return a 400 code with UserDoesNotExits error", (done) => {
      return request(app)
        .get(`${apiPath}/users/bookmarksGet/123`)
        .expect({ error: new UserDoesNotExits("whatever").toString() })
        .expect(400, done);
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
      const testUserId = Math.random().toString();
      const linkedBookmarkActant = "P1";
      await createUser(db, {
        id: testUserId,
        name: "test",
        email: "test@test.test",
        password: "test",
        bookmarks: [
          {
            name: "test",
            actantIds: [linkedBookmarkActant], // this id should exist in actants
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

      const bookmarkCountUsage = await getActantUsage(db, linkedBookmarkActant);
      request(app)
        .get(`${apiPath}/users/bookmarksGet/${testUserId}`)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys("bookmarks");
          res.body.bookmarks.should.be.a("array");
          res.body.bookmarks.should.have.lengthOf(1);
          res.body.bookmarks[0].actants.should.have.lengthOf(1);
          expect(res.body.bookmarks[0].actants[0].usedCount).eq(
            bookmarkCountUsage
          );
        })
        .expect(200, done);
    });
  });
});
