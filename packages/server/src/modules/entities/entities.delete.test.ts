import { clean, testErroneousResponse } from "@modules/common.test";
import { EntityDoesNotExist, InvalidDeleteError } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { findEntityById } from "@service/shorthands";
import { supertestConfig } from "..";
import { IEntity } from "@shared/types";
import Territory from "@models/territory/territory";
import Classification from "@models/relation/classification";
import Person from "@models/person/person";
import Concept from "@models/concept/concept";

describe("Entities delete", function () {
  describe("faulty data", () => {
    it("should return a EntityDoesNotExist error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .delete(`${apiPath}/entities/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new EntityDoesNotExist("", ""))
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    const db = new Db();
    const rand = Math.random().toString();
    const rootTerritory = new Territory({ id: `root-${rand}` });
    const leafTerritory = new Territory({
      data: { parent: { territoryId: rootTerritory.id, order: -1 } },
    });
    const deletableTerritory = new Territory({
      data: { parent: { territoryId: rootTerritory.id, order: -1 } },
    });
    const personEntity = new Person({ id: `P-${rand}` });
    const conceptEntity = new Concept({ id: `C-${rand}` });
    const relation = new Classification({
      entityIds: [personEntity.id, conceptEntity.id],
    });

    beforeAll(async () => {
      await db.initDb();
      await rootTerritory.save(db.connection);
      await leafTerritory.save(db.connection);
      await deletableTerritory.save(db.connection);
      await personEntity.save(db.connection);
      await conceptEntity.save(db.connection);
      await relation.save(db.connection);
      console.log("done");
    });

    afterAll(async () => await clean(db));

    it("should return a 200 code with successful response", async () => {
      await request(app)
        .delete(`${apiPath}/entities/${deletableTerritory.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(async () => {
          const deletedEntity = await findEntityById<IEntity>(
            db,
            deletableTerritory.id
          );
          expect(deletedEntity).toBeNull();
        });
    });

    describe("territory with childs", () => {
      it("should return an InvalidDeleteError error wrapped in IResponseGeneric", async () => {
        await request(app)
          .delete(`${apiPath}/entities/${rootTerritory.id}`)
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(
            testErroneousResponse.bind(undefined, new InvalidDeleteError(""))
          );
      });
    });

    describe("entity with relations", () => {
      it("should return an InvalidDeleteError error wrapped in IResponseGeneric", async () => {
        await request(app)
          .delete(`${apiPath}/entities/${personEntity.id}`)
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(
            testErroneousResponse.bind(undefined, new InvalidDeleteError(""))
          );
      });
    });
  });
});
