import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams, StatementDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/RethinkDB";
import { createEntity } from "@service/shorthands";
import Statement from "@models/statement/statement";

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
  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/statements/get`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Wrong param", () => {
    it("should return a StatementDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/statements/get/invalidId12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new StatementDoesNotExits("", "")
          )
        )
        .then(() => done());
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with IResponseStatement response", async (done) => {
      const db = new Db();
      await db.initDb();
      const randomId = Math.random().toString();
      await createEntity(
        db,
        new Statement({ id: randomId, data: { territory: { id: "2" } } })
      );
      await request(app)
        .get(`${apiPath}/statements/get/${randomId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect(testValidStatement);

      await clean(db);
      done();
    });
  });
});
