import { IActant } from "./actant";
import { languageDict } from "./../dictionaries";
import { ActantType } from "../enums";

const languageValues = languageDict.map((i) => i.value);
export interface ITerritory extends IActant {
  class: ActantType.Territory;
  data: {
    parent: IParentTerritory | false;
    type: string; // territoryTypeDict
    content: string;
  };
}

export interface IParentTerritory {
  id: string; // '' in case of root
  order: number;
}
