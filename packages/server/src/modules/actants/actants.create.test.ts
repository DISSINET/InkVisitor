import { successfulGenericResponse } from "@modules/common.test";
import { BadParams } from "@common/errors";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { getOneActant, supertestConfig } from "..";
import Statement from "@models/statement";
import Territory from "@models/territory";
import { deleteActant } from "@service/shorthands";
import { Db } from "@service/RethinkDB";

describe("Actants create", function () {
  describe("empty data", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .post(`${apiPath}/actants/create`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("faulty data ", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .post(`${apiPath}/actants/create`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful responsedsd", async (done) => {
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

      request(app)
        .post(`${apiPath}/actants/create`)
        .send(actantData)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse)
        .then(() => deleteActant(db, statementRandomId))
        .then(() => done());
    });
  });
});
