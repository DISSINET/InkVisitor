import {
  testFaultyMessage,
  successfulGenericResponse,
  should,
  clean,
} from "@modules/common.test";
import { ActantDoesNotExits, BadParams } from "@common/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { findActantById } from "../../service/shorthands";
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
        .expect({ error: new ActantDoesNotExits("").toString() })
        .expect(400, done);
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const db = new Db();
      await db.initDb();
      const territory = new Territory({});
      await territory.save(db.connection);

      request(app)
        .delete(`${apiPath}/actants/delete/${territory.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(async () => {
          const deletedActant = await findActantById<IActant>(db, territory.id);
          should.not.exist(deletedActant);
        })
        .then(() => done());
    });
  });

  describe("territory with childs", () => {
    it("should return a 400 code", async (done) => {
      const db = new Db();
      await db.initDb();
      const root = new Territory({});
      await root.save(db.connection);
      const leaf = new Territory({ data: { parent: { id: root.id } } });
      await leaf.save(db.connection);

      await request(app)
        .delete(`${apiPath}/actants/delete/${root.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(400);

      await clean(db);
      done();
    });
  });
});
