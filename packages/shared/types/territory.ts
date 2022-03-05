import { IEntity } from "./entity";
import { EntityClass } from "../enums";

export interface ITerritory extends IEntity {
  class: EntityClass.Territory;
  data: {
    parent: IParentTerritory | false;
  };
}

export interface IParentTerritory {
  id: string; // '' in case of root
  order: number;
}
