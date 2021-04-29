import { testErroneousResponse } from "@modules/common.test";
import { ActionDoesNotExits, BadParams } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { Db } from "@service/RethinkDB";
import { createAction, findActionById } from "@service/shorthands";

describe("Actions update", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapper in IResponseGeneric", (done) => {
      return request(app)
        .put(`${apiPath}/actions/update/1`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data", () => {
    it("should return a BadParams error wrapper in IResponseGeneric", (done) => {
      return request(app)
        .put(`${apiPath}/actions/update/1`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("not existing action", () => {
    it("should return a BadParams error wrapper in IResponseGeneric", (done) => {
      return request(app)
        .put(`${apiPath}/actions/update/21e4232e23231`)
        .send({ note: "" })
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
      const changeNoteInto = "newnote";
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
        .put(`${apiPath}/actions/update/${testId}`)
        .send({ note: changeNoteInto })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect({ success: true })
        .expect(200, async () => {
          const changedEntry = await findActionById(db, testId);
          changedEntry.note.should.eq(changeNoteInto);
          done();
        });
    });
  });
});
