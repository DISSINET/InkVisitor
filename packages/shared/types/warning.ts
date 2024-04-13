import { WarningTypeEnums } from "../enums";
import { ITerritoryValidation } from "./territory";

export interface IWarning {
  type: WarningTypeEnums;
  position?: IWarningPosition;
  origin: string;
  validation?: ITerritoryValidation;
}

export interface IWarningPosition {
  section?: IWarningPositionSection;
  subSection?: string;
  entityId?: string;
  actantId?: string;
}

export enum IWarningPositionSection {
  Relations = "Relations",
  Valencies = "Valencies",
  Statement = "Statement",
  Entity = "Entity",
}
