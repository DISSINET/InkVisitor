import {
  clean,
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import {
  EntityDoesNotExist,
  InternalServerError,
  ModelNotValidError,
} from "@shared/types/errors";
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
import { Db } from "@service/rethink";
import Territory from "@models/territory/territory";
import "ts-jest";
import { ITerritory } from "@shared/types";
import { prepareEntity } from "@models/entity/entity.test";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { prepareRelation } from "@models/relation/relation.test";
import Relation from "@models/relation/relation";
import { pool } from "@middlewares/db";

describe("Entities create", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a ModelNotValid error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/entities`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("faulty data ", () => {
    it("should return a ModelNotValid error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/entities`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("ok statement data", () => {
    it("should return a 200 code with successful responsedsd", async () => {
      const db = new Db();
      await db.initDb();

      const statementRandomId = Math.random().toString();
      const entityData = new Statement({
        id: statementRandomId,
        data: new StatementData({
          territory: new StatementTerritory({ territoryId: "not relevant" }),
        }),
      });

      await request(app)
        .post(`${apiPath}/entities`)
        .send(entityData)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      await clean(db);
    });
  });
  describe("create territory data with predefined id", () => {
    it("should create the entry with provided id", async () => {
      const db = new Db();
      await db.initDb();

      const randomId = Math.random().toString();
      const territoryData = new Territory({
        id: randomId,
      });

      await request(app)
        .post(`${apiPath}/entities`)
        .send(territoryData)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      const createdEntityData = await findEntityById(db, randomId);
      expect(createdEntityData).not.toBeNull();

      await clean(db);
    });
  });

  describe("create territory data without predefined id", () => {
    it("should create the entry with new id", async () => {
      const db = new Db();
      await db.initDb();
      await deleteEntities(db);

      const ent = new Territory({ label: "22323" });

      await request(app)
        .post(`${apiPath}/entities`)
        .send(ent)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      const allEnt = await getEntitiesDataByClass<ITerritory>(db, ent.class);
      expect(allEnt).toHaveLength(1);
      expect(allEnt[0].id).not.toBe("");
      expect(allEnt[0].label).toBe(ent.label);

      await clean(db);
    });
  });

  describe("test create from template", function () {
    const db = new Db();
    const [, conceptTemplate] = prepareEntity(EntityEnums.Class.Concept);
    conceptTemplate.label = "original label";
    conceptTemplate.isTemplate = true;

    const [, person] = prepareEntity(EntityEnums.Class.Person);
    const [, classif] = prepareRelation(RelationEnums.Type.Classification);
    classif.entityIds = [person.id, conceptTemplate.id];
    const [, related1] = prepareRelation(RelationEnums.Type.Related);
    related1.entityIds = [person.id, conceptTemplate.id];
    const [, related2] = prepareRelation(RelationEnums.Type.Related);
    related2.entityIds = [person.id, conceptTemplate.id];
    const [, identif] = prepareRelation(RelationEnums.Type.Identification);
    identif.entityIds = [person.id, conceptTemplate.id];

    // this will be created in test case
    const [, newEntity] = prepareEntity();

    beforeAll(async () => {
      await db.initDb();
      await conceptTemplate.save(db.connection);
      await person.save(db.connection);
      await classif.save(db.connection);
      await related1.save(db.connection);
      await related2.save(db.connection);
      await identif.save(db.connection);
    });
    afterAll(async () => await clean(db));

    describe("nonexisting template", function () {
      it("should throw an error", async () => {
        const [, newEntity] = prepareEntity();
        newEntity.usedTemplate = "random1235";

        await request(app)
          .post(`${apiPath}/entities`)
          .send(newEntity)
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(
            testErroneousResponse.bind(undefined, new EntityDoesNotExist(""))
          );
      });
    });

    describe("existing template", function () {
      it("should receive 200", async () => {
        newEntity.usedTemplate = conceptTemplate.id;

        await request(app)
          .post(`${apiPath}/entities`)
          .send(newEntity)
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200);
      });

      it("new entity should have altered field", async () => {
        const createdEntity = await findEntityById(db.connection, newEntity.id);
        expect(createdEntity.label).toContain(conceptTemplate.label);
        expect(createdEntity.label).not.toEqual(conceptTemplate.label); // should use root of the original label
        expect(createdEntity.isTemplate).toBeFalsy();
      });

      it("new entity should have copied relations (Cla/Rel)", async () => {
        const rels = await Relation.findForEntity(db.connection, newEntity.id);
        expect(rels.length).toEqual(3); // cla + 2x rel
        expect(rels.find((r) => r.id === classif.id)).toBeFalsy();
        expect(rels.find((r) => r.id === related1.id)).toBeFalsy();
        expect(rels.find((r) => r.id === related2.id)).toBeFalsy();

        expect(rels[0].entityIds.map((id) => id === person.id)).toBeTruthy();
        expect(rels[1].entityIds.map((id) => id === person.id)).toBeTruthy();
        expect(rels[2].entityIds.map((id) => id === person.id)).toBeTruthy();
      });
    });
  });
});
