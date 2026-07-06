import {
  clean,
  newMockRequest,
  testErroneousResponse,
} from "@modules/common.test";
import {
  BadParams,
  RelationDoesNotExist,
  ModelNotValidError,
} from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { Db } from "@service/rethink";
import { successfulGenericResponse } from "@modules/common.test";
import Relation from "@models/relation/relation";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import { prepareEntity } from "@models/entity/entity.test";

describe("Relations update", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/relations/1`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("bad id", () => {
    it("should return an RelationDoesNotExist error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/relations/___`)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new RelationDoesNotExist(""))
        );
    });
  });
  describe("faulty data", () => {
    it("should return an BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/relations/___`)
        .send({})
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

      await authAgent
        .put(`${apiPath}/relations/${relationEntry.id}`)
        .send({ type: "" })
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

      // PUT route requires isValid() (>= 2 entityIds) and entities to exist in
      // db. Both Superclass and Antonym accept Concept-Concept.
      const [, c1] = prepareEntity(EntityEnums.Class.Concept);
      const [, c2] = prepareEntity(EntityEnums.Class.Concept);
      await c1.save(db.connection);
      await c2.save(db.connection);

      const changeTypeTo: RelationEnums.Type = RelationEnums.Type.Antonym;
      const relationEntry = new Relation({
        type: RelationEnums.Type.Superclass,
        entityIds: [c1.id, c2.id],
      });

      await relationEntry.save(db.connection);

      await authAgent
        .put(`${apiPath}/relations/${relationEntry.id}`)
        .send({ type: changeTypeTo })
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
