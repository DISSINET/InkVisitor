import { clean, testErroneousResponse } from "@modules/common.test";
import { EntityDoesNotExist, InvalidDeleteError } from "@shared/types/errors";
import { Db } from "@service/rethink";
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
import { pool } from "@middlewares/db";
import Statement, { StatementActant } from "@models/statement/statement";
import { link } from "fs";

describe("Entities delete - single entity", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("faulty data", () => {
    it("should return a EntityDoesNotExist error wrapped in IResponseGeneric", async () => {
      await request(app)
        .delete(`${apiPath}/entities/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new EntityDoesNotExist("", ""))
        );
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
    });

    afterAll(async () => await clean(db));

    test("should return a 200 code with successful response + entity should not be retrievable", async () => {
      await request(app)
        .delete(`${apiPath}/entities/${deletableTerritory.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200);

      const deletedEntity = await findEntityById(db, deletableTerritory.id);
      expect(deletedEntity).toBeNull();
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

describe("Entities delete - batch", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("not dependent entities", () => {
    const db = new Db();
    const rand = Math.random().toString();
    const personEntity = new Person({ id: `P1-${rand}` });
    const conceptEntity = new Concept({ id: `C1-${rand}` });

    const dependentUponEntity1 = new Concept({ id: `C2-${rand}` });
    const linkedStatement1 = new Statement({ id: `S2-${rand}` });
    linkedStatement1.data.actants = [
      new StatementActant({ id: dependentUponEntity1.id, entityId: dependentUponEntity1.id }),
    ];

    const dependentUponEntity2 = new Concept({ id: `C3-${rand}` });
    const linkedStatement2 = new Statement({ id: `S3-${rand}` });
    linkedStatement2.data.actants = [
      new StatementActant({ id: dependentUponEntity2.id, entityId: dependentUponEntity2.id }),
    ];
    const linkedStatement3 = new Statement({ id: `S3-2-${rand}` });
    linkedStatement3.data.actants = [
      new StatementActant({ id: dependentUponEntity2.id, entityId: dependentUponEntity2.id }),
    ];

    beforeAll(async () => {
      await db.initDb();
      await personEntity.save(db.connection);
      await conceptEntity.save(db.connection);
      await dependentUponEntity1.save(db.connection);
      await linkedStatement1.save(db.connection);
      await dependentUponEntity2.save(db.connection);
      await linkedStatement2.save(db.connection);
      await linkedStatement3.save(db.connection);
    });

    afterAll(async () => await clean(db));

    test("should return a 200 code with successful response", async () => {
      await request(app)
        .delete(`${apiPath}/entities/`)
        .send({ entityIds: [personEntity.id, conceptEntity.id]})
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200);

      const deletedEntity1 = await findEntityById(db, personEntity.id);
      expect(deletedEntity1).toBeNull();

      const deletedEntity2 = await findEntityById(db, conceptEntity.id);
      expect(deletedEntity2).toBeNull();
    });

    test("should return a 200 code with successful response when deleting 2 self-dependent entities", async () => {
      await request(app)
        .delete(`${apiPath}/entities/`)
        .send({ entityIds: [dependentUponEntity1.id, linkedStatement1.id]})
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200);

      const deletedEntity1 = await findEntityById(db, dependentUponEntity1.id);
      expect(deletedEntity1).toBeNull();

      const deletedEntity2 = await findEntityById(db, linkedStatement1.id);
      expect(deletedEntity2).toBeNull();
    });

    test("should return a 200 code with successful response when deleting 2 self-dependent entities, with one entity linked to persisting entity", async () => {
      const data = await request(app)
        .delete(`${apiPath}/entities/`)
        .send({ entityIds: [dependentUponEntity2.id, linkedStatement2.id]})
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200);

        console.log(JSON.stringify(data.body, null, 4))
      const deletedEntity1 = await findEntityById(db, dependentUponEntity2.id);
      expect(deletedEntity1).not.toBeNull();

      const deletedEntity2 = await findEntityById(db, linkedStatement2.id);
      expect(deletedEntity2).toBeNull();
    });
  });
});