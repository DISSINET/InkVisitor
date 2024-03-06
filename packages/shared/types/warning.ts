import { WarningTypeEnums } from "../enums";
import { IActionValency } from "./action";

export interface IWarning {
  type: WarningTypeEnums;
  position?: IWarningPosition
  origin: string;
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
