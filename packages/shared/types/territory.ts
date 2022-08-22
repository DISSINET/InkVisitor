import { IEntity } from "./entity";
import { EntityEnums } from "../enums";

export interface ITerritory extends IEntity {
  class: EntityEnums.Class.Territory;
  data: {
    parent: IParentTerritory | false;
  };
}

export interface IParentTerritory {
  territoryId: string; // '' in case of root
  order: number;
}
