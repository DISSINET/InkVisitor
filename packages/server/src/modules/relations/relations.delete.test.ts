import {
  clean,
  newMockRequest,
  testErroneousResponse,
} from "@modules/common.test";
import { RelationDoesNotExist } from "@inkvisitor/shared/types/errors";
import { Db } from "@service/rethink";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { getAuthenticatedAgent } from "@modules/testAuth";
import Relation from "@models/relation/relation";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";

describe("Relations delete", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("bad id", () => {
    it("should return a RelationDoesNotExist error wrapped in IResponseGeneric", async () => {
      await authAgent
        .delete(`${apiPath}/relations/randomid12345`)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new RelationDoesNotExist(""))
        );
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      const db = new Db();
      await db.initDb();

      const relationEntry = new Relation({
        type: RelationEnums.Type.Superclass,
      });
      await relationEntry.save(db.connection);

      await authAgent
        .delete(`${apiPath}/relations/${relationEntry.id}`)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(async () => {
          const deletedEntity = await Relation.getById(
            newMockRequest(db),
            relationEntry.id
          );
          expect(deletedEntity).toBeNull();
        });

      await clean(db);
    });
  });
});
