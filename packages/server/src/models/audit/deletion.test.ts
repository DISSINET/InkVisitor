import "ts-jest";
import { Db } from "@service/rethink";
import { clean } from "@modules/common.test";
import { AuditScope } from "@inkvisitor/shared/types";
import { EventType } from "@inkvisitor/shared/types/stats";
import Audit from "./audit";

// DB setup/teardown (clean wipes several tables) can exceed jest's 5s default
jest.setTimeout(60000);

describe("Audit.createDeletionAudit", function () {
  describe("entity scope", () => {
    const db = new Db();
    const entityId = `entity-${Math.random().toString()}`;
    const userId = `user-${Math.random().toString()}`;

    beforeAll(async () => {
      await db.initDb();
      await Audit.createDeletionAudit(
        db.connection,
        entityId,
        userId,
        AuditScope.Entity
      );
    });

    afterAll(async () => await clean(db));

    it("writes exactly one minimal DELETE audit for the entity", async () => {
      const audits = await Audit.getLastNForEntity(db.connection, entityId, 10);

      expect(audits).toHaveLength(1);
      expect(audits[0].type).toBe(EventType.DELETE);
      expect(audits[0].changes).toEqual({});
      expect(audits[0].user).toBe(userId);
      expect(audits[0].auditScope).toBe(AuditScope.Entity);
    });
  });

  describe("document scope", () => {
    const db = new Db();
    const documentId = `document-${Math.random().toString()}`;
    const userId = `user-${Math.random().toString()}`;

    beforeAll(async () => {
      await db.initDb();
      await Audit.createDeletionAudit(
        db.connection,
        documentId,
        userId,
        AuditScope.Document
      );
    });

    afterAll(async () => await clean(db));

    it("writes exactly one minimal ANCHOR_DELETE audit for the document", async () => {
      const audits = await Audit.getLastNForDocument(
        db.connection,
        documentId,
        10
      );

      expect(audits).toHaveLength(1);
      expect(audits[0].type).toBe(EventType.ANCHOR_DELETE);
      expect(audits[0].changes).toEqual({});
      expect(audits[0].user).toBe(userId);
      expect(audits[0].auditScope).toBe(AuditScope.Document);
    });
  });
});
