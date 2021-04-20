import { IActant } from ".";
import { ActantType } from "../enums";
import { languageDict } from "./../dictionaries";

const languageValues = languageDict.map((i) => i.value);

export interface IResource extends IActant {
  class: ActantType.Resource;
  data: {
    content: string;
    link: string;
    type: string;
    lang: typeof languageValues[number];
  };
}
