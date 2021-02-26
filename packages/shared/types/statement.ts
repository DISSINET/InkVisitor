import { IActant, IProp } from "./";

export interface IStatement extends IActant {
    class: "S";
    data: {
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
        props: IProp[];
        actants: {
            id: string;
            actant: string;
            position: string;
            elvl: string;
            certainty: string;
        }[];
    };
}
