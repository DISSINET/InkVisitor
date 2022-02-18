export interface IAudit {
  id: string;
  entityId: string;
  user: string;
  date: Date;
  changes: object;
}
