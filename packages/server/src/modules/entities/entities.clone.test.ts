import {
  clean,
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import { EntityDoesNotExist, ModelNotValidError } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import {
  deleteEntities,
  findEntityById,
  getEntitiesDataByClass,
} from "@service/shorthands";
import { Db } from "@service/RethinkDB";
import Territory from "@models/territory/territory";
import "ts-jest";
import { ITerritory } from "@shared/types";
import { prepareEntity } from "@models/entity/entity.test";
import { prepareRelation } from "@models/relation/relation.test";
import { RelationEnums } from "@shared/enums";
import { getRelationClass } from "@models/factory";
import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";

describe("Entities clone", function () {
  describe("non existing original entity", () => {
    it("should return a ModelNotValid error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/entities/doesnotexist/clone`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new EntityDoesNotExist("", ""))
        )
        .then(() => done());
    });
  });
  describe("existing invalid source entity", () => {
    const db = new Db();

    beforeAll(async () => {
      await db.initDb();
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should return a ModelNotValid error wrapped in IResponseGeneric", async () => {
      const entity = new Statement({}); // invalid - empty territory
      const saved = await entity.save(db.connection); // should be saved without isValid test
      expect(saved).toBeTruthy();

      await request(app)
        .post(`${apiPath}/entities/${entity.id}/clone`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("existing valid source entity", () => {
    const db = new Db();
    const [, entity] = prepareEntity();
    const [, relationEntity] = prepareEntity(); // so the relation is valid
    const [, relation] = prepareRelation(RelationEnums.Type.Related);
    entity.label = `${entity.id}-label`;
    let entitiesSaved = false;
    let relationSaved = false;

    beforeAll(async () => {
      await db.initDb();
      entitiesSaved =
        (await entity.save(db.connection)) &&
        (await relationEntity.save(db.connection));
      relation.entityIds = [entity.id, relationEntity.id];

      relationSaved = await relation.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("originals should be saved and valid", () => {
      expect(entitiesSaved).toBeTruthy();
      expect(entity.isValid()).toBeTruthy();
      expect(relationSaved).toBeTruthy();
    });

    it("should return a successful response wrapped in IResponseGeneric", async () => {
      const data = await request(app)
        .post(`${apiPath}/entities/${entity.id}/clone`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200);
      const clonedId = data.body.data;
      expect(clonedId).toBeTruthy();

      const clone = await findEntityById(db, clonedId);
      expect(clone).toBeTruthy();
      expect(clone.label).toEqual(entity.label);

      const clonedRelations = await Relation.getForEntity(
        db.connection,
        clone.id
      );
      expect(clonedRelations).toHaveLength(1);
      expect(clonedRelations[0].id).not.toEqual(relation.id);
      expect(clonedRelations[0].entityIds).toContain(clonedId);
      expect(clonedRelations[0].entityIds).toContain(relationEntity.id);
    });
  });
});
