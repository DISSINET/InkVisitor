export interface IProp {
    id: string;
    elvl: string;
    certainty: string;
    modality: string;
    origin: string;

    type: {
        id: string;
        certainty: string;
        elvl: string;
    };
    value: {
        id: string;
        certainty: string;
        elvl: string;
    };
}
