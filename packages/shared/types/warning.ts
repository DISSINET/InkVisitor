import { WarningTypeEnums } from "../enums";
import { ITerritoryValidation } from "./territory";

export interface IWarning {
  type: WarningTypeEnums;
  position?: IWarningPosition;
  origin: string;
  validation?: ITerritoryValidation;
  // optional, warning-type-specific breakdown of where the problem is. The
  // interpretation depends on `type` - the renderer for each warning type
  // decides how to present these. e.g. for ISYNC each entry is a concept in
  // the synonym cloud, with `relatedEntityIds` = the superclasses it is missing
  // to reach parity (which would clear the warning).
  details?: IWarningDetail[];
}

export interface IWarningDetail {
  entityId: string;
  relatedEntityIds?: string[];
  text?: string;
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
