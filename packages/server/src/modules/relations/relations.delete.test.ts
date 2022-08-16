import {
  clean,
  newMockRequest,
  testErroneousResponse,
} from "@modules/common.test";
import { RelationDoesNotExist } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import Relation from "@models/relation/relation";
import { RelationType } from "@shared/enums";

describe("Relations delete", function () {
  describe("bad id", () => {
    it("should return a RelationDoesNotExist error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .delete(`${apiPath}/relations/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new RelationDoesNotExist(""))
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async (done) => {
      const db = new Db();
      await db.initDb();

      const relationEntry = new Relation({ type: RelationType.Superclass });
      await relationEntry.save(db.connection);

      await request(app)
        .delete(`${apiPath}/relations/${relationEntry.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
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
      done();
    });
  });
});
