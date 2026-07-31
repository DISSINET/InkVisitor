import { clean, testErroneousResponse } from "@modules/common.test";
import { EntityDoesNotExist, InvalidDeleteError } from "@inkvisitor/shared/types/errors";
import { Db } from "@service/rethink";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { findEntityById } from "@service/shorthands";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { IEntity } from "@inkvisitor/shared/types";
import Territory from "@models/territory/territory";
import Classification from "@models/relation/classification";
import Person from "@models/person/person";
import Concept from "@models/concept/concept";
import Resource from "@models/resource/resource";
import Value from "@models/value/value";
import { pool } from "@middlewares/db";
import Statement, { StatementActant } from "@models/statement/statement";
import { link } from "fs";

describe("Entities delete - single entity", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  // NOTE: the shared db pool is ended once in the final top-level describe's
  // afterAll. Ending it here would drain the pool before the later
  // "Entities delete - batch" describe runs, causing database-timeout 500s.
  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  describe("faulty data", () => {
    it("should return a EntityDoesNotExist error wrapped in IResponseGeneric", async () => {
      await authAgent
        .delete(`${apiPath}/entities/randomid12345`)
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
      await authAgent
        .delete(`${apiPath}/entities/${deletableTerritory.id}`)
        .expect("Content-Type", /json/)
        .expect(200);

      const deletedEntity = await findEntityById(db, deletableTerritory.id);
      expect(deletedEntity).toBeNull();
    });

    describe("territory with childs", () => {
      it("should return an InvalidDeleteError error wrapped in IResponseGeneric", async () => {
        await authAgent
          .delete(`${apiPath}/entities/${rootTerritory.id}`)
          .expect("Content-Type", /json/)
          .expect(
            testErroneousResponse.bind(undefined, new InvalidDeleteError(""))
          );
      });
    });

    describe("entity with relations", () => {
      it("should return an InvalidDeleteError error wrapped in IResponseGeneric", async () => {
        await authAgent
          .delete(`${apiPath}/entities/${personEntity.id}`)
          .expect("Content-Type", /json/)
          .expect(
            testErroneousResponse.bind(undefined, new InvalidDeleteError(""))
          );
      });
    });
  });

  describe("entity used in another entity's references", () => {
    const db = new Db();
    const rand = Math.random().toString();
    const resourceEntity = new Resource({ id: `R-ref-${rand}` });
    const valueEntity = new Value({ id: `V-ref-${rand}` });
    const referencingEntity = new Person({
      id: `P-ref-${rand}`,
      references: [
        { id: `ref-${rand}`, resource: resourceEntity.id, value: valueEntity.id },
      ],
    });

    beforeAll(async () => {
      await db.initDb();
      await resourceEntity.save(db.connection);
      await valueEntity.save(db.connection);
      await referencingEntity.save(db.connection);
    });

    afterAll(async () => await clean(db));

    it("should block deleting the reference resource with a \"reference\" conflict", async () => {
      const res = await authAgent
        .delete(`${apiPath}/entities/${resourceEntity.id}`)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new InvalidDeleteError(""))
        );

      expect(res.body.data).toEqual({
        type: "reference",
        ids: [referencingEntity.id],
      });
    });

    it("should block deleting the reference value with a \"reference\" conflict", async () => {
      const res = await authAgent
        .delete(`${apiPath}/entities/${valueEntity.id}`)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new InvalidDeleteError(""))
        );

      expect(res.body.data).toEqual({
        type: "reference",
        ids: [referencingEntity.id],
      });
    });
  });
});

describe("Entities delete - batch", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

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

    const referencedResource = new Resource({ id: `R4-${rand}` });
    const referencingPerson = new Person({
      id: `P4-${rand}`,
      references: [
        { id: `ref4-${rand}`, resource: referencedResource.id, value: "" },
      ],
    });

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
      await referencedResource.save(db.connection);
      await referencingPerson.save(db.connection);
      await dependentUponEntity2.save(db.connection);
      await linkedStatement2.save(db.connection);
      await linkedStatement3.save(db.connection);
    });

    afterAll(async () => await clean(db));

    test("should return a 200 code with successful response", async () => {
      await authAgent
        .delete(`${apiPath}/entities/`)
        .send({ entityIds: [personEntity.id, conceptEntity.id]})
        .expect("Content-Type", /json/)
        .expect(200);

      const deletedEntity1 = await findEntityById(db, personEntity.id);
      expect(deletedEntity1).toBeNull();

      const deletedEntity2 = await findEntityById(db, conceptEntity.id);
      expect(deletedEntity2).toBeNull();
    });

    test("should return a 200 code with successful response when deleting 2 self-dependent entities", async () => {
      await authAgent
        .delete(`${apiPath}/entities/`)
        .send({ entityIds: [dependentUponEntity1.id, linkedStatement1.id]})
        .expect("Content-Type", /json/)
        .expect(200);

      const deletedEntity1 = await findEntityById(db, dependentUponEntity1.id);
      expect(deletedEntity1).toBeNull();

      const deletedEntity2 = await findEntityById(db, linkedStatement1.id);
      expect(deletedEntity2).toBeNull();
    });

    test("should delete a reference resource together with its referencing entity in one batch", async () => {
      await authAgent
        .delete(`${apiPath}/entities/`)
        .send({ entityIds: [referencedResource.id, referencingPerson.id] })
        .expect("Content-Type", /json/)
        .expect(200);

      const deletedResource = await findEntityById(db, referencedResource.id);
      expect(deletedResource).toBeNull();

      const deletedPerson = await findEntityById(db, referencingPerson.id);
      expect(deletedPerson).toBeNull();
    });

    test("should return a 200 code with successful response when deleting 2 self-dependent entities, with one entity linked to persisting entity", async () => {
      const data = await authAgent
        .delete(`${apiPath}/entities/`)
        .send({ entityIds: [dependentUponEntity2.id, linkedStatement2.id]})
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