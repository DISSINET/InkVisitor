import {
  clean,
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import { ModelNotValidError } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { Db } from "@service/rethink";
import "ts-jest";
import Relation from "@models/relation/relation";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import { prepareEntity } from "@models/entity/entity.test";

describe("Relations create", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a ModelNotValid", async () => {
      await authAgent
        .post(`${apiPath}/relations`)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("faulty data ", () => {
    it("should return a ModelNotValid", async () => {
      await authAgent
        .post(`${apiPath}/relations`)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      const db = new Db();
      await db.initDb();

      // Superclass requires two existing Concept (or Action) entities; isValid()
      // also requires at least 2 entityIds and the route checks they exist in db.
      const [, c1] = prepareEntity(EntityEnums.Class.Concept);
      const [, c2] = prepareEntity(EntityEnums.Class.Concept);
      await c1.save(db.connection);
      await c2.save(db.connection);

      const newRelation = new Relation({
        type: RelationEnums.Type.Superclass,
        entityIds: [c1.id, c2.id],
      });

      await authAgent
        .post(`${apiPath}/relations`)
        .send(newRelation)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      await clean(db);
    });
  });
  describe("duplicated id", () => {
    it("should return a ModelNotValidError", async () => {
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

      await authAgent
        .post(`${apiPath}/relations`)
        .send(newRelation)
        .expect(400)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );

      await clean(db);
    });
  });
});
