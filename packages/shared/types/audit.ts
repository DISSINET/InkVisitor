import { LabelI } from ".";

export interface AuditI {
    id: string;
    user: string;
    date: Date;
    changes: Object;
}
