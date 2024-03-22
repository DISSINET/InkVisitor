import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

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
  tieType: EProtocolTieType; // default is property
  tieLevel?: {
    // relevant only in case of Classification or Property is selected as a tie
    levelStatement: boolean; // default is true
    levelMeta: boolean; // default is true
  };
  propType?: string[]; // relevant only in case of Property is selected as a tie
  allowedClasses?: EntityEnums.Class[]; // not relevant if allowedEntities is set
  allowedEntities?: string[]; //
  detail: string;
}

export enum EProtocolTieType {
  Property = "Property",
  Classification = "Classification",
  Reference = "Reference",
}
