import { EventType } from "./stats";

export type AuditScope = "entity" | "document";

export interface IAudit {
  id: string;
  modelId: string;
  auditScope: AuditScope;
  user: string;
  date: Date;
  changes: object;
  type: EventType;
}
