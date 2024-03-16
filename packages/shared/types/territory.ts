import { IEntity } from "./entity";
import { EntityEnums } from "../enums";

export interface ITerritory extends IEntity {
  class: EntityEnums.Class.Territory;
  data: ITerritoryData;
}

export interface ITerritoryData {
  parent: IParentTerritory | false;
  protocols?: IStatementProtocol[];
}

export interface IStatementProtocol {
  type: string; // C class entity assigned
  detail: string;
  values?: string[]; // this is a list of entity ids that would be possible to assign to this protocol prop value
}

export interface IParentTerritory {
  territoryId: string; // '' in case of root
  order: number;
}
