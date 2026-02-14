import { EventType } from "./stats";

export enum AuditScope {
  Entity = "entity",
  Document = "document",
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
