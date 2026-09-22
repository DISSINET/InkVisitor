import { IDbModel, fillFlatObject } from "@models/common";
import { Conn, WriteResult, storage } from "@service/storage";
import { IAudit, AuditScope } from "@inkvisitor/shared/types";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import { IRequest } from "../../custom_typings/request";
import { EventType } from "@inkvisitor/shared/types/stats";

export default class Audit implements IAudit, IDbModel {
  static table = "audits";

  id = "";
  modelId = "";
  auditScope: AuditScope = AuditScope.Entity;
  user = "";
  date: Date = new Date();
  changes: object = {};
  type: EventType = EventType.EDIT;

  constructor(data: Partial<IAudit>) {
    if (!data) {
      return;
    }

    fillFlatObject(this, { ...data });
    this.changes = data.changes as object;
    const d = data as Record<string, unknown>;
    if (!this.modelId && d.entityId != null) {
      this.modelId = String(d.entityId);
      this.auditScope = AuditScope.Entity;
    } else if (!this.modelId && d.documentId != null) {
      this.modelId = String(d.documentId);
      this.auditScope = AuditScope.Document;
    }
  }

  /**
   * Stores the audit in the db
   * @param db db connection
   * @returns boolean to indicate result of the operation
   */
  async save(db: Conn | undefined): Promise<boolean> {
    const result = await storage.audits.insert(db as Conn, {
      ...this,
      id: this.id || undefined,
    });

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1;
  }

  /**
   * Throws error immediately - Audit entry is immutable.
   * Provides implementation for satisfying IDbModel interface.
   * @param db rethinkdb Conn
   * @param updateData Promise<WriteResult>
   */
  update(
    db: Conn | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    throw new InternalServerError("Audit entry cannot be updated");
  }

  /**
   * Throws error immediately - Audit entry is immutable.
   * Provides implementation for satisfying IDbModel interface.
   * @param db rethinkdb Conn
   * @param updateData Promise<WriteResult>
   */
  async delete(db: Conn): Promise<WriteResult> {
    throw new InternalServerError("Audit entry cannot be deleted");
  }

  /**
   * Predicate for testing if the Audit entry is valid
   * @returns boolean
   */
  isValid(): boolean {
    return true;
  }

  /**
   * Combines Audit constructor and save method to immediately create & persist
   * an audit for any scope (entity, document or relation).
   * @param req IRequest
   * @param auditScope scope of the audited model
   * @param modelId id of the audited model
   * @param changes blob containing snapshot of the model data
   * @param type event type
   * @returns Promise<boolean>
   */
  static async createNew(
    req: IRequest,
    auditScope: AuditScope,
    modelId: string,
    changes: object,
    type: EventType
  ): Promise<boolean> {
    const entry = new Audit({
      modelId,
      auditScope,
      user: req.getUserOrFail().id,
      changes,
      type,
    });
    return entry.save(req.db.connection);
  }

  /**
   * Resolves the audit event type for a document save based on what changed.
   * A single save produces a single typed audit, chosen by priority:
   * anchor additions > anchor removals > anchor attribute edits > text changes
   * > generic edit.
   *
   * Anchor changes are detected from the raw content tags so that anchors whose
   * entity does not exist yet (e.g. a freshly anchored statement saved before
   * its entity is created) are still recognised as anchor changes.
   * @returns EventType the resolved event type
   */
  static resolveDocumentAuditType(params: {
    anchorsAdded: boolean;
    anchorsRemoved: boolean;
    anchorAttributesChanged: boolean;
    contentChanged: boolean;
  }): EventType {
    const { anchorsAdded, anchorsRemoved, anchorAttributesChanged, contentChanged } =
      params;
    if (anchorsAdded) {
      return EventType.ANCHOR_ADD;
    }
    if (anchorsRemoved) {
      return EventType.ANCHOR_DELETE;
    }
    if (anchorAttributesChanged) {
      return EventType.ANCHOR_EDIT;
    }
    if (contentChanged) {
      return EventType.TEXT_EDIT;
    }
    return EventType.EDIT;
  }

  /**
   * Resolves the deletion event type for an audit scope. Document deletions are
   * recorded as anchor removals (their anchors disappear with them), entity
   * deletions as plain deletions. Both fold into the matching edit type in the
   * stats (ANCHOR_DELETE -> ANCHOR_EDIT, DELETE -> EDIT).
   */
  static deletionEventType(scope: AuditScope): EventType {
    return scope === AuditScope.Document
      ? EventType.ANCHOR_DELETE
      : EventType.DELETE;
  }

  /**
   * Records the single audit written when an entity or document is deleted,
   * typed per scope via deletionEventType. The optional snapshot holds the full
   * data of the deleted model so it can later be restored (see the entity
   * restore route); when omitted it defaults to empty changes.
   * @param db rethinkdb Conn
   * @param modelId id of the deleted entity/document
   * @param userId id of the user performing the deletion
   * @param scope audit scope (entity or document)
   * @param snapshot full snapshot of the deleted model (used for restore)
   */
  static async createDeletionAudit(
    db: Conn | undefined,
    modelId: string,
    userId: string,
    scope: AuditScope,
    snapshot: object = {}
  ): Promise<void> {
    await new Audit({
      modelId,
      auditScope: scope,
      user: userId,
      changes: snapshot,
      type: Audit.deletionEventType(scope),
    }).save(db);
  }

  /**
   * Retrieves first created audit entry for entity.
   * First audit entry stands for created-at entry.
   * @param db rethinkdb Conn
   * @param entityId string
   * @returns Promise<Audit | null>
   */
  static async getFirstForEntity(
    db: Conn,
    entityId: string
  ): Promise<Audit | null> {
    const result = await storage.audits.firstFor(db, AuditScope.Entity, entityId);

    return result ? new Audit(result) : null;
  }

  /**
   * Gets the earliest audit entry date in the database
   * @param db rethinkdb Conn
   * @returns Promise<Date | null>
   */
  static async getEarliestDate(db: Conn): Promise<Date | null> {
    try {
      return await storage.audits.earliestDate(db);
    } catch (error) {
      // Table might not exist yet or be empty
      return null;
    }
  }

  /**
   * Retrieves last created audit entry for entity.
   * Last audit entry stands for updated-at entry.
   * @param db rethinkdb Conn
   * @param entityId string
   * @returns Promise<Audit | null>
   */
  static async getLastForEntity(
    db: Conn,
    entityId: string
  ): Promise<Audit | null> {
    const result = await storage.audits.lastFor(db, AuditScope.Entity, entityId);

    return result ? new Audit(result) : null;
  }

  /**
   * Retrieves N audits for entity, ordered by date DESC (last N items)
   * @param dbConn rethinkdb Conn
   * @param entityId string
   * @param n limit for returned entries
   * @returns Promise<Audit[]>
   */
  static async getLastNForEntity(
    dbConn: Conn,
    entityId: string,
    n = 5
  ): Promise<Audit[]> {
    const result = await storage.audits.lastNFor(dbConn, AuditScope.Entity, entityId, n);

    return result.map((r) => new Audit(r));
  }

  /**
   * Retrieves the N most recent relation audits connected to an entity, i.e.
   * relation create/edit/delete audits whose snapshot lists this entity in its
   * entityIds. Backed by the relation_entityIds multi-index (which only holds
   * relation-scoped rows); the auditScope filter is a defensive guard. Ordered
   * newest-first and capped (mirroring the entity `last` cap) so a heavily
   * edited entity's Detail/Audits section stays bounded.
   * @param db rethinkdb Conn
   * @param entityId string
   * @param n max number of returned entries
   * @returns Promise<Audit[]>
   */
  static async getRelationAuditsForEntity(
    db: Conn,
    entityId: string,
    n = 10
  ): Promise<Audit[]> {
    const result = await storage.audits.relationAuditsForEntity(db, entityId, n);

    return result.map((r) => new Audit(r));
  }

  static async getLastNForDocument(
    dbConn: Conn,
    documentId: string,
    n = 10
  ): Promise<Audit[]> {
    const result = await storage.audits.lastNFor(dbConn, AuditScope.Document, documentId, n);

    return result.map((r) => new Audit(r));
  }

  static async getFirstForDocument(
    db: Conn,
    documentId: string
  ): Promise<Audit | null> {
    const result = await storage.audits.firstFor(db, AuditScope.Document, documentId);

    return result ? new Audit(result) : null;
  }

  /**
   * Retrieved Audit entries that are first entries for respective entity, effectively searching for entities created
   * on particular date
   * @param db rethinkdb Conn
   * @param date created date
   * @returns Promise<Audit[]> list of Audit entries
   */
  static async getByCreatedDate(db: Conn, date: Date): Promise<Audit[]> {
    const result = await storage.audits.onDate(db, date);

    const audits = result.map((data) => new Audit(data)) as Audit[];
    const entityAudits = audits.filter((a) => a.auditScope === AuditScope.Entity);
    const byEntity = Object.values(
      entityAudits.reduce((acc, curr) => {
        if (!curr.modelId) return acc;
        if (!acc[curr.modelId] || acc[curr.modelId].date > curr.date) {
          acc[curr.modelId] = curr;
        }
        return acc;
      }, {} as Record<string, Audit>)
    );

    const withValidDate: Audit[] = [];
    for (const audit of byEntity) {
      if (!audit.modelId) continue;
      const firstAudit = await Audit.getFirstForEntity(db, audit.modelId);
      if (
        firstAudit &&
        firstAudit.date.toISOString().split("T")[0] ===
        audit.date.toISOString().split("T")[0]
      ) {
        withValidDate.push(firstAudit);
      }
    }

    return withValidDate;
  }

  /**
   * Retrieved Audit entries that are last entries for respective entity, effectively searching for entities updated
   * on particular date
   * @param db rethinkdb Conn
   * @param date updated date
   * @returns Promise<Audit[]> list of Audit entries
   */
  static async getByUpdatedDate(db: Conn, date: Date): Promise<Audit[]> {
    const result = await storage.audits.onDate(db, date);

    const audits = result.map((data) => new Audit(data)) as Audit[];
    const entityAudits = audits.filter((a) => a.auditScope === AuditScope.Entity);
    const byEntity = Object.values(
      entityAudits.reduce((acc, curr) => {
        if (!curr.modelId) return acc;
        if (!acc[curr.modelId] || acc[curr.modelId].date > curr.date) {
          acc[curr.modelId] = curr;
        }
        return acc;
      }, {} as Record<string, Audit>)
    );

    const withValidDate: Audit[] = [];
    for (const audit of byEntity) {
      if (!audit.modelId) continue;
      const firstAudit = await Audit.getLastForEntity(db, audit.modelId);
      if (
        firstAudit &&
        firstAudit.date.toISOString().split("T")[0] ===
        audit.date.toISOString().split("T")[0]
      ) {
        withValidDate.push(firstAudit);
      }
    }

    return withValidDate;
  }

  /**
   * Retrieved Audit entries that are last entries for respective entity, where the last
   * update falls within the optional [after, before] datetime range (inclusive).
   */
  static async getByUpdatedInRange(
    db: Conn,
    after?: Date,
    before?: Date,
  ): Promise<Audit[]> {
    const result = await storage.audits.entityScopedInRange(db, after, before);
    const audits = result.map((data) => new Audit(data)) as Audit[];
    const entityIds = [
      ...new Set(
        audits
          .map((audit) => audit.modelId)
          .filter((modelId): modelId is string => Boolean(modelId)),
      ),
    ];

    const withValidDate: Audit[] = [];
    for (const entityId of entityIds) {
      const lastAudit = await Audit.getLastForEntity(db, entityId);
      if (!lastAudit) {
        continue;
      }

      const lastDate = lastAudit.date;
      if (after && lastDate < after) {
        continue;
      }
      if (before && lastDate > before) {
        continue;
      }

      withValidDate.push(lastAudit);
    }

    return withValidDate;
  }

  /**
   * Retrieves Audit entries that are first entries for respective entity, where the
   * creation (first audit) falls within the optional [after, before] datetime range
   * (inclusive).
   */
  static async getByCreatedInRange(
    db: Conn,
    after?: Date,
    before?: Date,
  ): Promise<Audit[]> {
    const result = await storage.audits.entityScopedInRange(db, after, before);
    const audits = result.map((data) => new Audit(data)) as Audit[];
    const entityIds = [
      ...new Set(
        audits
          .map((audit) => audit.modelId)
          .filter((modelId): modelId is string => Boolean(modelId)),
      ),
    ];

    const withValidDate: Audit[] = [];
    for (const entityId of entityIds) {
      const firstAudit = await Audit.getFirstForEntity(db, entityId);
      if (!firstAudit) {
        continue;
      }

      const firstDate = firstAudit.date;
      if (after && firstDate < after) {
        continue;
      }
      if (before && firstDate > before) {
        continue;
      }

      withValidDate.push(firstAudit);
    }

    return withValidDate;
  }

  /**
   * Retrieves Audit entries that are created by specific user
   * @param db rethinkdb Conn
   * @param createdBy string
   * @returns Promise<Audit[]> list of Audit entries
   */
  static async getByCreatedBy(
    db: Conn,
    createdBy: string
  ): Promise<Audit[]> {
    const result = await storage.audits.byTypeAndUser(db, EventType.CREATE, createdBy);
    return result.map((data) => new Audit(data)) as Audit[];
  }

  /**
   * Retrieves Audit entries that are updated by specific user
   * @param db rethinkdb Conn
   * @param updatedBy string
   * @returns Promise<Audit[]> list of Audit entries
   */
  static async getByUpdatedBy(
    db: Conn,
    updatedBy: string
  ): Promise<Audit[]> {
    const result = await storage.audits.byTypeAndUser(db, EventType.EDIT, updatedBy);
    return result.map((data) => new Audit(data)) as Audit[];
  }

  /**
   * returns first date-sorted entries for specific params
   * @param db
   * @param filter
   * @returns
   */
  static async findMany(
    db: Conn,
    filter: { skip: number; take: number; from: Date }
  ): Promise<Audit[]> {
    const result = await storage.audits.page(db, filter);

    return result.map((data) => new Audit(data)) as Audit[];
  }
}
