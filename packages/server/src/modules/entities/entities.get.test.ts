import { clean, testErroneousResponse } from "@modules/common.test";
import { EntityDoesNotExist, BadParams } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";

describe("Entities get method", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/entities`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Wrong param", () => {
    it("should return an EntityDoesNotExist error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/entities/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(undefined, new EntityDoesNotExist("", ""))
        );
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with user response", async () => {
      const db = new Db();
      await db.initDb();

      const statementRandomId = Math.random().toString();
      const entityData = new Statement({
        id: statementRandomId,
        data: new StatementData({
          territory: new StatementTerritory({
            territoryId: "not relevant",
          }),
        }),
      });

      await entityData.save(db.connection);

      await request(app)
        .get(`${apiPath}/entities/${statementRandomId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body).toEqual("object");
          expect(res.body.id).toBeTruthy();
        });

      await clean(db);
    });
  });
});
