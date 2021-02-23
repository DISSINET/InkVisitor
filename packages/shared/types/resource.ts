import { ILabel, IActant } from ".";
import { languageDict } from "./../dictionaries";

const languageValues = languageDict.map((i) => i.value);

export interface IResource extends IActant {
    class: "R";
    data: {
        content: string;
        link: string;
        type: string;
        lang: typeof languageValues[number];
    };
}
