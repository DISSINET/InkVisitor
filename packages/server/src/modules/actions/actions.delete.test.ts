import { should, testErroneousResponse } from "@modules/common.test";
import { ActionDoesNotExits, BadParams } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { createAction, findActionById } from "../../service/shorthands";
import { supertestConfig } from "..";
import { successfulGenericResponse } from "@modules/common.test";

describe("Actions delete", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapper in IResponseGeneric", (done) => {
      return request(app)
        .delete(`${apiPath}/actions/delete`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data", () => {
    it("should return a ActionDoesNotExits error wrapper in IResponseGeneric", (done) => {
      return request(app)
        .delete(`${apiPath}/actions/delete/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ActionDoesNotExits(""))
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const db = new Db();
      await db.initDb();
      const testId = Math.random().toString();
      await createAction(
        db,
        {
          id: testId,
          labels: [],
          valencies: [],
          types: [],
          rulesProperties: [],
          rulesActants: [],
          parent: "",
          note: "",
        },
        true
      );

      request(app)
        .delete(`${apiPath}/actions/delete/${testId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200, async () => {
          const deletedEntry = await findActionById(db, testId);
          should.not.exist(deletedEntry);
          done();
        });
    });
  });
});
