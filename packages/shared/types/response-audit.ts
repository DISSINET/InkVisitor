import { IAudit } from "./";

export interface IResponseAudit {
  entity: string;
  last: IAudit[];
  first?: IAudit;
}
