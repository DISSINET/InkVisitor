import { WarningTypeEnums } from "../enums";
import { IActionValency } from "./action";

export interface IWarning {
  type: WarningTypeEnums;
  position?: IWarningPosition;
  origin: string;
}

export interface IWarningPosition {
  section?: string;
  subSection?: keyof IActionValency;
  entityId?: string;
  actantId?: string;
}
