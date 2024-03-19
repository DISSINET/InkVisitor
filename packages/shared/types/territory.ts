import { IEntity } from "./entity";
import { EntityEnums } from "../enums";

export interface ITerritory extends IEntity {
  class: EntityEnums.Class.Territory;
  data: ITerritoryData;
}

export interface ITerritoryData {
  parent: IParentTerritory | false;
  protocols?: ITerritoryProtocol[];
}

export interface IParentTerritory {
  territoryId: string; // '' in case of root
  order: number;
}

export interface ITerritoryProtocol {
  entityClasses: EntityEnums.Class[];
  classifications: string[];
  tieType: EProtocolTieType;
  propType?: string[]; // only in case of MetaProp and InStatementProp tie
  allowedClasses?: EntityEnums.Class[];
  allowedEntities?: string[];
  detail: string;
}

export enum EProtocolTieType {
  MetaProp = "MetaProp",
  InStatementProp = "InStatementProp",
  CLARelation = "CLARelation",
  InStatementCLARelation = "InStatementCLARelation",
  Reference = "Reference",
}
