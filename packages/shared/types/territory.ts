import { IEntity } from "./entity";
import { EntityEnums } from "../enums";

export interface ITerritory extends IEntity {
  class: EntityEnums.Class.Territory;
  data: ITerritoryData;
}

export interface ITerritoryData {
  parent: IParentTerritory | false;
  protocol?: ITerritoryProtocol;
}

export interface IParentTerritory {
  territoryId: string; // '' in case of root
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
