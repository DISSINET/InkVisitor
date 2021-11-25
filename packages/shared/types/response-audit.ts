import {IAudit} from "./";

export interface IResponseAudit {
  actant: string;
  logs: IAudit[];
}
