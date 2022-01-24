import { clean, testErroneousResponse } from "@modules/common.test";
import {
  ActantDoesNotExits,
  BadParams,
  InvalidDeleteError,
} from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { findActantById } from "@service/shorthands";
import { supertestConfig } from "..";
import { IActant } from "@shared/types";
import Territory from "@models/territory/territory";

describe("Actants delete", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .delete(`${apiPath}/actants/delete`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data", () => {
    it("should return a ActantDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .delete(`${apiPath}/actants/delete/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ActantDoesNotExits("", ""))
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const db = new Db();
      await db.initDb();
      const territory = new Territory({});
      await territory.save(db.connection);

      await request(app)
        .delete(`${apiPath}/actants/delete/${territory.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(async () => {
          const deletedActant = await findActantById<IActant>(db, territory.id);
          expect(deletedActant).toBeNull();
        });

      await clean(db);
      done();
    });
  });

  describe("territory with childs", () => {
    it("should return an InvalidDeleteError error wrapped in IResponseGeneric", async (done) => {
      const db = new Db();
      await db.initDb();
      const root = new Territory({});
      await root.save(db.connection);
      const leaf = new Territory({
        data: { parent: { id: root.id, order: -1 } },
      });
      await leaf.save(db.connection);

      await request(app)
        .delete(`${apiPath}/actants/delete/${root.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new InvalidDeleteError(""))
        );

      await clean(db);
      done();
    });
  });
});
