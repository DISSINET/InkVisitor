import { IAudit } from "./";
import { AuditScope } from "./audit";

export interface IResponseAudit {
  modelId: string;
  auditScope: AuditScope;
  last: IAudit[];
  first?: IAudit;
  /**
   * Relation audits connected to this model (create/edit/delete of relations
   * that reference it). Populated only for entity audits; empty for documents.
   */
  relations: IAudit[];
}
