import { WarningTypeEnums } from "../enums";
<<<<<<< HEAD
import { IActionValency } from "./action";
=======
import { ITerritoryValidation } from "./territory";
>>>>>>> dev

export interface IWarning {
  type: WarningTypeEnums;
  position?: IWarningPosition
  origin: string;
  validation?: ITerritoryValidation;
}

export interface IWarningPosition {
<<<<<<< HEAD
  
=======
>>>>>>> dev
  section?: IWarningPositionSection;
  subSection?: string;
  entityId?: string;
  actantId?: string;
}

export enum IWarningPositionSection {
  Relations = "Relations",
  Valencies = "Valencies",
  Statement = "Statement",
<<<<<<< HEAD
=======
  Entity = "Entity",
>>>>>>> dev
}
