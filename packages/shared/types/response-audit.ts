import { IAudit } from "./";

export interface IResponseAudit {
  actant: string;
  last: IAudit[];
  first?: IAudit;
}
