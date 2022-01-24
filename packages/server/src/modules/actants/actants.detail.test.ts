import { clean, testErroneousResponse } from "@modules/common.test";
import { ActantDoesNotExits, BadParams } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/RethinkDB";
import Statement from "@models/statement/statement";

describe("Actants detail", function () {
  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric",
      (done) => {
        return request(app).
          get(`${apiPath}/actants/detail`).
          set("authorization", "Bearer " + supertestConfig.token).
          expect(testErroneousResponse.bind(undefined, new BadParams(""))).
          then(() => done());
      });
  });
  describe("Wrong param", () => {
    it("should return a ActantDoesNotExits error wrapped in IResponseGeneric",
      (done) => {
        return request(app).
          get(`${apiPath}/actants/detail/123`).
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
        get(`${apiPath}/actants/detail/${statementRandomId}`).
        set("authorization", "Bearer " + supertestConfig.token).
        expect(200).
        expect((res) => {
          expect(typeof res.body).toEqual("object");
          expect(res.body.id).toEqual(statementRandomId);
        });

      await clean(db);
      done();
    });
  });
});
