import {
  clean,
  newMockRequest,
  testErroneousResponse,
} from "@modules/common.test";
import {
  BadParams,
  RelationDoesNotExist,
  ModelNotValidError,
} from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { Db } from "@service/rethink";
import { successfulGenericResponse } from "@modules/common.test";
import Relation from "@models/relation/relation";
import { RelationEnums } from "@shared/enums";
import { pool } from "@middlewares/db";

describe("Relations update", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .put(`${apiPath}/relations/1`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("bad id", () => {
    it("should return an RelationDoesNotExist error wrapped in IResponseGeneric", async () => {
      await request(app)
        .put(`${apiPath}/relations/___`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new RelationDoesNotExist(""))
        );
    });
  });
  describe("faulty data", () => {
    it("should return an BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .put(`${apiPath}/relations/___`)
        .send({})
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("faulty data - bad type", () => {
    it("should return an ModelNotValidError error wrapped in IResponseGeneric", async () => {
      const db = new Db();
      await db.initDb();

      const relationEntry = new Relation({});
      await relationEntry.save(db.connection);

      await request(app)
        .put(`${apiPath}/relations/${relationEntry.id}`)
        .send({ type: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );

      await clean(db);
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      const db = new Db();
      await db.initDb();

      const changeTypeTo: RelationEnums.Type = RelationEnums.Type.Antonym;
      const relationEntry = new Relation({
        type: RelationEnums.Type.Superclass,
        entityIds: ["1"],
      });

      await relationEntry.save(db.connection);

      await request(app)
        .put(`${apiPath}/relations/${relationEntry.id}`)
        .send({ type: changeTypeTo })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(successfulGenericResponse)
        .expect(async () => {
          const changedEntry = await Relation.getById(
            newMockRequest(db),
            relationEntry.id
          );
          expect(changedEntry?.type).toEqual(changeTypeTo);
        });

      await clean(db);
    });
  });
});
