import { ILabel } from ".";

export interface IAudit {
  id: string;
  actantId: string;
  user: string;
  date: Date;
  changes: object;
}
