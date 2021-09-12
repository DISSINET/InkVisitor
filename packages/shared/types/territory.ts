import { IActant } from "./actant";
import { ActantType } from "../enums";

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
