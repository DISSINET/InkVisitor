import {
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import { AuditDoesNotExist } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { supertestConfig } from "..";
import { findEntityById } from "@service/shorthands";
import { Db } from "@service/rethink";
import "ts-jest";
import { prepareEntity } from "@models/entity/entity.test";
import { AuditScope } from "@inkvisitor/shared/types";
import Audit from "@models/audit/audit";
import { pool } from "@middlewares/db";

// The restoration endpoint was redesigned: it is now
// `POST /entities/:entityId/restore` (no `fromAuditId` query param). It restores
// the entity from its last stored audit snapshot. Therefore the previous
// scenarios that relied on `fromAuditId` (BadParams for empty/mismatched audit)
// and the `EntityDoesExist` guard no longer apply and have been removed.
describe("Entities restoration", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("non existing entities", () => {
    it("should return a AuditDoesNotExist error wrapped in IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/entities/random/restore`)
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
    const randomId = Math.random().toString();
    const restorableId = `entity-${randomId}`;
    // Audit snapshot for an entity that does not currently exist - so that
    // restoring it will create the entity from the stored snapshot.
    const validAudit = new Audit({
      modelId: restorableId,
      auditScope: AuditScope.Entity,
      changes: {
        ...JSON.parse(JSON.stringify(entity)),
        id: restorableId,
      },
    });
    beforeAll(async () => {
      await db.initDb();
      await validAudit.save(db.connection);
    });

    afterAll(async () => {
      await db.close();
    });

    it("should restore the entity from valid audit and return successful IResponseGeneric", async () => {
      await request(app)
        .post(`${apiPath}/entities/${validAudit.modelId}/restore`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      const restored = await findEntityById(db.connection, validAudit.modelId);
      expect(restored).toBeTruthy();
    });
  });
});
