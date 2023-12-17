import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams, TerritoryDoesNotExits } from "@shared/types/errors";
import { Db } from "@service/rethink";
import { createEntity, deleteEntities } from "@service/shorthands";
import Territory from "@models/territory/territory";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import Statement, { StatementData } from "@models/statement/statement";
import { supertestConfig } from "..";
import { pool } from "@middlewares/db";

describe("Territories get query", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/territories`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Wrong param", () => {
    it("should return a TerritoryDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/territories/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new TerritoryDoesNotExits("", "")
          )
        );
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with IResponseTerritory response", async () => {
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
        data: new StatementData({
          territory: {
            territoryId: "some random",
            order: 1,
          },
        }),
      });
      await createEntity(db, statement1);

      const statement2 = new Statement({
        data: new StatementData({
          tags: [statement1.id],
          territory: {
            territoryId: testTerritoryId,
            order: 2,
          },
        }),
      });
      await createEntity(db, statement2);

      await request(app)
        .get(`${apiPath}/territories/${testTerritoryId}`)
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
    });
  });
});
