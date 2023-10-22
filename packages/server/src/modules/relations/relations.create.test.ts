import {
  clean,
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import { ModelNotValidError } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { Db } from "@service/rethink";
import "ts-jest";
import Relation from "@models/relation/relation";
import { RelationEnums } from "@shared/enums";

describe("Relations create", function () {
  describe("empty data", () => {
    it("should return a ModelNotValid", (done) => {
      return request(app)
        .post(`${apiPath}/relations`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        )
        .then(() => done());
    });
  });
  describe("faulty data ", () => {
    it("should return a ModelNotValid", (done) => {
      return request(app)
        .post(`${apiPath}/relations`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const db = new Db();
      await db.initDb();

      const newRelation = new Relation({
        type: RelationEnums.Type.Superclass,
        entityIds: ["1"],
      });

      await request(app)
        .post(`${apiPath}/relations`)
        .send(newRelation)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      await clean(db);
      done();
    });
  });
  describe("duplicated id", () => {
    it("should return a ModelNotValidError", async (done) => {
      const db = new Db();
      await db.initDb();

      const prepared = new Relation({
        type: RelationEnums.Type.Superclass,
        entityIds: ["1"],
      });

      await prepared.save(db.connection);

      const newRelation = new Relation({
        id: prepared.id,
        type: RelationEnums.Type.Superclass,
        entityIds: ["1"],
      });

      await request(app)
        .post(`${apiPath}/relations`)
        .send(newRelation)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(400)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );

      await clean(db);
      done();
    });
  });
});
