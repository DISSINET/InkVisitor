export interface IAudit {
  id: string;
  entityId: string;
  userId: string;
  date: Date;
  changes: object;
}
