import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams, TerritoryDoesNotExits } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import { createEntity, deleteEntities } from "@service/shorthands";
import Territory from "@models/territory/territory";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import Statement from "@models/statement/statement";
import { supertestConfig } from "..";

describe("Territories get query", function () {
  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/territories/get`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Wrong param", () => {
    it("should return a TerritoryDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/territories/get/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(undefined, new TerritoryDoesNotExits("", ""))
        )
        .then(() => done());
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with IResponseTerritory response", async (done) => {
      const db = new Db();
      await db.initDb();
      await deleteEntities(db);
      const testTerritoryId = Math.random().toString();
      const linkedStatementId = Math.random().toString();

      const territory: Territory = new Territory({
        id: testTerritoryId,
      });
      await createEntity(db, territory);

      const statement1 = new Statement({
        id: linkedStatementId,
        data: {
          territory: {
            id: "some random",
            order: 1,
          },
        },
      });
      await createEntity(db, statement1);

      const statement2 = new Statement({
        data: {
          tags: [statement1.id],
          territory: {
            id: testTerritoryId,
            order: 2,
          },
        },
      });
      await createEntity(db, statement2);

      await request(app)
        .get(`${apiPath}/territories/get/${testTerritoryId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeTruthy();
          expect(typeof res.body).toEqual("object");
          expect(Object.keys(res.body).sort()).toEqual(
            [...Object.keys(territory), "statements", "actants"].sort()
          );

          expect(res.body.statements).toHaveLength(1);
          expect(res.body.actants).toHaveLength(2);
          expect(res.body.id).toEqual(testTerritoryId);
        });

      await clean(db);
      return done();
    });
  });
});
