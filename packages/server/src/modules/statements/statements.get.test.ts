import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams, StatementDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/rethink";
import { createEntity } from "@service/shorthands";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import { pool } from "@middlewares/db";

const testValidStatement = (res: any) => {
  expect(res.body).toBeTruthy();
  expect(typeof res.body).toEqual("object");
  const actionExample = new Statement({});

  expect(Object.keys(res.body).sort()).toEqual(
    Object.keys(actionExample).sort()
  );
  expect(res.body.id).toBeTruthy();
};

describe("Statements get", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/statements`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Wrong param", () => {
    it("should return a StatementDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/statements/invalidId12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new StatementDoesNotExits("", "")
          )
        );
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with IResponseStatement response", async () => {
      const db = new Db();
      await db.initDb();
      const randomId = Math.random().toString();
      await createEntity(
        db,
        new Statement({
          id: randomId,
          data: new StatementData({
            territory: new StatementTerritory({ territoryId: "2" }),
          }),
        })
      );
      await request(app)
        .get(`${apiPath}/statements/${randomId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect(testValidStatement);

      await clean(db);
    });
  });
});
