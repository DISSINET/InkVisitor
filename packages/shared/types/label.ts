import { DictionaryI } from "./";
import { languageDict } from "./../dictionaries";

const languageValues = languageDict.map((i) => i.value);

export interface LabelI {
    id: string;
    value: string;
    lang: typeof languageValues[number];
    primary: boolean;
}
