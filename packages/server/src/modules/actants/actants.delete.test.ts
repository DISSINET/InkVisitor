import {
  testFaultyMessage,
  successfulGenericResponse,
  should,
} from "@modules/common.test";
import { BadParams } from "@common/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { createActant, findActantById } from "../../service/shorthands";
import { supertestConfig } from "..";
import { IActant } from "@shared/types";
import Territory from "@models/territory";

describe("Actants delete", function () {
  describe("empty data", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .delete(`${apiPath}/actants/delete`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("faulty data", () => {
    it("should return a 200 code with unsuccessful message", (done) => {
      return request(app)
        .delete(`${apiPath}/actants/delete/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testFaultyMessage)
        .expect(200, done);
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const db = new Db();
      await db.initDb();
      const testId = Math.random().toString();
      await createActant(
        db,
        new Territory({
          id: testId,
        })
      );

      request(app)
        .delete(`${apiPath}/actants/delete/${testId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .expect(200, async () => {
          const deletedActant = await findActantById<IActant>(db, testId);
          should.not.exist(deletedActant);
          done();
        });
    });
  });
});
