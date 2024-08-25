import { EventType } from "./stats";

export interface IAudit {
  id: string;
  entityId: string;
  user: string;
  date: Date;
  changes: object;
  type: EventType;
}
