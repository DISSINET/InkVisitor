import { IAudit } from "./";
import { AuditScope } from "./audit";

export interface IResponseAudit {
  modelId: string;
  auditScope: AuditScope;
  last: IAudit[];
  first?: IAudit;
}
