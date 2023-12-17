import "ts-jest";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../server";
import { IStatement } from "@shared/types";
import { Db } from "@service/rethink";
import { deleteEntities } from "@service/shorthands";
import Territory from "@models/territory/territory";
import Statement from "@models/statement/statement";
import { IRequest } from "src/custom_typings/request";
import { pool } from "@middlewares/db";

describe("Territories getEntityIds", () => {
  let db: Db;
  const baseStatementData = new Statement({});
  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteEntities(db);
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("one territory, two linked statement via territory.id and tags at once", () => {
    it("should return empty array", async () => {
      const territory = new Territory({});
      await territory.save(db.connection);

      // statements linked by tag/reference and territory - 3 linked actants
      const statementData1: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData1.data.territory = { territoryId: territory.id, order: 0 };
      statementData1.data.tags = ["tagid"];

      // second statement is the same - should not duplicate ids
      const statementData2: IStatement = JSON.parse(
        JSON.stringify(statementData1)
      );

      const statement1 = new Statement({ ...statementData1 });
      await statement1.save(db.connection);
      const statement2 = new Statement({ ...statementData2 });
      await statement2.save(db.connection);

      await request(app)
        .get(`${apiPath}/territories/${territory.id}/entities`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res: IRequest) => {
          expect(res.body).not.toBeNull();
          expect(res.body?.constructor.name).toEqual("Array");
          expect(res.body).toHaveLength(3);
        });
    });
  });
});
