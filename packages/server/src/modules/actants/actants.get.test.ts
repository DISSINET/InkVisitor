import { clean, testErroneousResponse } from "@modules/common.test";
import { ActantDoesNotExits, BadParams } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import Statement from "@models/statement/statement";
import { Db } from "@service/RethinkDB";

describe("Actants get method", function () {
  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric",
      (done) => {
        return request(app).
          get(`${apiPath}/actants/get`).
          set("authorization", "Bearer " + supertestConfig.token).
          expect(testErroneousResponse.bind(undefined, new BadParams(""))).
          then(() => done());
      });
  });
  describe("Wrong param", () => {
    it("should return an ActantDoesNotExits error wrapped in IResponseGeneric",
      (done) => {
        return request(app).
          get(`${apiPath}/actants/get/123`).
          set("authorization", "Bearer " + supertestConfig.token).
          expect(
            testErroneousResponse.bind(undefined,
              new ActantDoesNotExits("", "")),
          ).
          then(() => done());
      });
  });
  describe("Correct param", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();

      const statementRandomId = Math.random().toString();
      const actantData = new Statement({
        id: statementRandomId,
        data: {
          territory: {
            id: "not relevant",
          },
        },
      });

      await actantData.save(db.connection);

      await request(app).
        get(`${apiPath}/actants/get/${statementRandomId}`).
        set("authorization", "Bearer " + supertestConfig.token).
        expect(200).
        expect((res) => {
          expect(typeof res.body).toEqual("object");
          expect(res.body.id).toBeTruthy();
        });

      await clean(db);
      done();
    });
  });
});
