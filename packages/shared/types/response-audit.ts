import { IAudit } from "./";

export interface IResponseAudit {
  entityId: string;
  last: IAudit[];
  first?: IAudit;
}
