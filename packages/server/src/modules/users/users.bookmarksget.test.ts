import { testErroneousResponse } from "@modules/common.test";
import { UserDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { createEntity } from "@service/shorthands";
import { Db } from "@service/rethink";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import { supertestConfig } from "..";
import User from "@models/user/user";
import { IBookmarkFolder } from "@shared/types";
import { pool } from "@middlewares/db";

describe("Users bookmarksGet", function () {
  const db = new Db();

  beforeAll(async () => {
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("Wrong param", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/users/123/bookmarks`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(undefined, new UserDoesNotExits("", ""))
        );
    });
  });
  describe("Correct param with nonexistent entity", () => {
    it("should return a 200 code with empty array of bookmarks", async () => {
      const testUserId = Math.random().toString();
      const user = new User({ id: testUserId, bookmarks: [] });
      await user.save(db.connection);

      await request(app)
        .get(`${apiPath}/users/${testUserId}/bookmarks`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect((res) => {
          expect(res.body).toEqual([]);
        })
        .expect(200);
    });
  });
  describe("Correct param with existing entity", () => {
    it("should return a 200 code with non-empty array of bookmarks", async () => {
      const testId = Math.random().toString();

      await createEntity(
        db,
        new Statement({
          id: testId,
          data: new StatementData({
            territory: new StatementTerritory({ territoryId: "any" }),
          }),
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

      await request(app)
        .get(`${apiPath}/users/${testId}/bookmarks`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].entities).toHaveLength(1);
        })
        .expect(200);
    });
  });
});
