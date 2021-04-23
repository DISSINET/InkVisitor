import { expect } from "@modules/common.test";
import { ActantDoesNotExits, BadParams } from "@common/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { createActant } from "@service/shorthands";
import { Db } from "@service/RethinkDB";
import Statement from "@models/statement";

describe("Actants detail", function () {
  describe("Empty param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .get(`${apiPath}/actants/detail`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Wrong param", () => {
    it("should return a 400 code with ActantDoesNotExits error", (done) => {
      return request(app)
        .get(`${apiPath}/actants/detail/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect({ error: new ActantDoesNotExits("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();
      const testId = Math.random().toString();
      const testData = new Statement({
        id: testId,
      });
      await createActant(db, testData);

      request(app)
        .get(`${apiPath}/actants/detail/${testId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys([...Object.keys(testData), "usedCount"]);
          expect(res.body.id).eq(testId);
        })
        .then(() => done());
    });
  });
});
