import {
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import {
  AuditDoesNotExist,
  BadParams,
  EntityDoesExist,
} from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { findEntityById } from "@service/shorthands";
import { Db } from "@service/rethink";
import "ts-jest";
import { prepareEntity } from "@models/entity/entity.test";
import Audit from "@models/audit/audit";
import { pool } from "@middlewares/db";

describe("Entities restoration", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("empty fromAuditId", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/entities/1/restoration?fromAuditId=`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("non existing entities", () => {
    it("should return a AuditDoesNotExist error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/entities/random/restoration?fromAuditId=random`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new AuditDoesNotExist(""))
        );
    });
  });
  describe("ok statement data", () => {
    const db = new Db();
    const [, entity] = prepareEntity();
    const [, differentEntity] = prepareEntity();
    const audit = new Audit({
      entityId: entity.id,
      changes: JSON.parse(JSON.stringify(entity)),
    });
    const randomId = Math.random().toString();
    const validAudit = new Audit({
      entityId: `entity-${randomId}`,
      changes: {
        ...JSON.parse(JSON.stringify(entity)),
        id: `entity-${randomId}`,
      },
    });
    beforeAll(async () => {
      await db.initDb();
      await differentEntity.save(db.connection);
      await entity.save(db.connection);
      await audit.save(db.connection);
      await validAudit.save(db.connection);
    });

    afterAll(async () => {
      await db.close();
    });

    it("should return a BadParams error wrapped in IResponseGeneric if audit is not for entity", async () => {
      await request(app)
        .post(
          `${apiPath}/entities/${differentEntity.id}/restoration?fromAuditId=${audit.id}`
        )
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("should return a EntityDoesExist error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(
          `${apiPath}/entities/${entity.id}/restoration?fromAuditId=${audit.id}`
        )
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new EntityDoesExist("")));
    });

    it("should restore the entity from valid audit and return successful IResponseGeneric", async () => {
      await request(app)
        .post(
          `${apiPath}/entities/${validAudit.entityId}/restoration?fromAuditId=${validAudit.id}`
        )
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      const restored = await findEntityById(db.connection, validAudit.entityId);
      expect(restored).toBeTruthy();
    });
  });
});
