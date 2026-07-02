import { Connection } from "rethinkdb-ts";
import { IAudit, IResponseAudit, AuditScope } from "@inkvisitor/shared/types";
import Audit from "./audit";

export class ResponseAudit implements IResponseAudit {
  modelId: string;
  auditScope: AuditScope = AuditScope.Entity;
  last: IAudit[] = [];
  first?: IAudit;
  relations: IAudit[] = [];

  constructor(entityId: string) {
    this.modelId = entityId;
  }

  async prepare(db: Connection): Promise<void> {
    this.last = await Audit.getLastNForEntity(db, this.modelId, 10);
    if (this.last.length) {
      const firstEntity = await Audit.getFirstForEntity(db, this.modelId);
      if (firstEntity) {
        this.first = firstEntity;
      }
    }
    this.relations = await Audit.getRelationAuditsForEntity(db, this.modelId);
  }
}

export class ResponseDocumentAudit implements IResponseAudit {
  modelId: string;
  auditScope: AuditScope = AuditScope.Document;
  last: IAudit[] = [];
  first?: IAudit;
  relations: IAudit[] = [];

  constructor(documentId: string) {
    this.modelId = documentId;
  }

  async prepare(db: Connection, noAudits = 5): Promise<void> {
    this.last = await Audit.getLastNForDocument(db, this.modelId, noAudits);
    if (this.last.length) {
      const firstDoc = await Audit.getFirstForDocument(db, this.modelId);
      if (firstDoc) {
        this.first = firstDoc;
      }
    }
  }
}
