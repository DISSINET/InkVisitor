import { ActantI } from "./";

export interface StatementI extends ActantI {
    class: "S";
    action: string;
    territory: {
        id: string;
        order: number;
    };
    references: {
        id: string;
        resource: string;
        part: string;
        type: string;
    }[];
    tags: string[];
    certainty: string;
    elvl: string;
    modality: string;
    text: string;
    note: string;
    props: {
        id: string;
        order: number;
        origin: string;
        type: string;
        value: string;
        elvl: string;
        certainty: string;
    }[];
    actants: {
        id: string;
        order: number;
        actant: string;
        position: string;
        elvl: string;
        certainty: string;
    }[];
}
