import { testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { createEntity } from "@service/shorthands";
import { Db } from "@service/rethink";
import Statement, { StatementData, StatementTerritory } from "@models/statement/statement";
import { supertestConfig } from "..";
import User from "@models/user/user";
import { IBookmarkFolder } from "@shared/types";

describe("Users bookmarksGet", function () {
  describe("Wrong param", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/users/123/bookmarks`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        )
        .then(() => done());
    });
  });
  describe("Correct param with nonexistent entity", () => {
    it("should return a 200 code with empty array of bookmarks", async (done) => {
      const db = new Db();
      await db.initDb();
      const testUserId = Math.random().toString();
      const user = new User({ id: testUserId, bookmarks: [] });
      await user.save(db.connection);

      request(app)
        .get(`${apiPath}/users/${testUserId}/bookmarks`)
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
  describe("Correct param with existing entity", () => {
    it("should return a 200 code with non-empty array of bookmarks", async (done) => {
      const db = new Db();
      await db.initDb();
      const testId = Math.random().toString();

      await createEntity(
        db,
        new Statement({
          id: testId,
          data: new StatementData({ territory: new StatementTerritory({ territoryId: "any" }) })
        })
      );

      const user = new User({
        id: testId,
        bookmarks: [
          {
            id: "test",
            name: "test",
            entityIds: [testId], // this id should exist in entities
          } as IBookmarkFolder,
        ],
      });
      await user.save(db.connection);

      request(app)
        .get(`${apiPath}/users/${testId}/bookmarks`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys("bookmarks");
          res.body.bookmarks.should.be.a("array");
          res.body.bookmarks.should.have.lengthOf(1);
          res.body.bookmarks[0].entities.should.have.lengthOf(1);
        })
        .expect(200, done);
    });
  });
});
