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
  guidelinesVersion: string;
  guidelinesResource: string; // R class entity
  variant: ECASTEMOVariant;
  description: string;
  startDate: string; // V class entity
  endDate: string; // V class entity
}

export enum ECASTEMOVariant {
  SumCASTEMO = "SumCASTEMO",
  NoCASTEMO = "NoCASTEMO",
  SelCASTEMO = "SelCASTEMO",
  FullCASTEMO = "FullCASTEMO",
  MGSTEMO = "MGSTEMO",
}

export interface ITerritoryValidation {
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
