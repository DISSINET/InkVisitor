import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

export interface ITerritory extends IEntity {
  class: EntityEnums.Class.Territory;
  data: ITerritoryData;
}

export interface ITerritoryData {
  protocol?: ITerritoryProtocol;
  parent: IParentTerritory | false; // TODO should be optional instead of false
  validations?: ITerritoryValidation[];
}

export interface IParentTerritory {
  territoryId: string;
  order: number;
}

export interface ITerritoryProtocol {
  project: string;
  guidelinesResource: string[]; // R class entities
  description: string;
  startDate: string; // V class entity
  endDate: string; // V class entity
}

export interface ITerritoryValidation {
  entityClasses: EntityEnums.Class[];
  classifications: string[];
  tieType: EProtocolTieType; // default is property
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
