import { IActant } from "./actant";
import { languageDict } from "./../dictionaries";

const languageValues = languageDict.map((i) => i.value);
export interface ITerritory extends IActant {
  class: "T";
  data: {
    parent: IParentTerritory | false;
    type: string; // territoryTypeDict
    content: string;
    lang: typeof languageValues[number];
  };
}

export interface IParentTerritory {
  id: string; // '' in case of root
  order: number;
}
