import { BadParams, UserDoesNotExits } from "@common/errors";
import { Db } from "@service/RethinkDB";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import {
  createActant,
  createUser,
  findActantById,
} from "../../service/shorthands";
import { supertestConfig } from "..";

const should = chai.should();

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
        .expect({ success: false, errors: 0 })
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
        {
          id: testId,
          class: "T",
          data: {},
          labels: [],
        },
        true
      );

      request(app)
        .delete(`${apiPath}/actants/delete/${testId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect({ success: true })
        .expect(200, async () => {
          const deletedActant = await findActantById(db, testId);
          should.not.exist(deletedActant);
          done();
        });
    });
  });
});
