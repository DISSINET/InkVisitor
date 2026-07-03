import { EventType } from "./stats";

export interface IAnchorUpdate {
  anchor: string;
  occurrence: number;
}

export interface IDocumentAuditAnchorChanges {
  changes: IAnchorUpdate[];
  additions: IAnchorUpdate[];
  removals: IAnchorUpdate[];
}

export enum AuditScope {
  Entity = "entity",
  Document = "document",
  Relation = "relation",
}

export interface IAudit {
  id: string;
  modelId: string;
  auditScope: AuditScope;
  user: string;
  date: Date;
  changes: object;
  type: EventType;
}
