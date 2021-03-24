import { IOption } from "./";
import { languageDict } from "./../dictionaries";

const languageValues = languageDict.map((i) => i.value);

export interface ILabel {
  id: string;
  value: string;
  lang: typeof languageValues[number];
}
