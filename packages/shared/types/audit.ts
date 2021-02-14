import { LabelI } from ".";

export interface AuditI {
    id: string;
    user: string;
    date: Date;
    changes: ChangeI[];
}

interface ChangeI {
    id: string;
    newValue: object;
}
