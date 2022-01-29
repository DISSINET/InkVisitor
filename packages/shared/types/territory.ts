import { IActant } from "./actant";
import { EntityClass } from "../enums";

export interface ITerritory extends IActant {
  class: EntityClass.Territory;
  data: {
    parent: IParentTerritory | false;
  };
}

export interface IParentTerritory {
  id: string; // '' in case of root
  order: number;
}
