import { ILabel } from ".";

export interface IAudit {
    id: string;
    user: string;
    date: Date;
    changes: IChange[];
}

interface IChange {
    id: string;
    newValue: object;
}
