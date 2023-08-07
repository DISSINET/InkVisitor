import { WarningTypeEnums } from "../enums";

export interface IWarning {
  type: WarningTypeEnums;
  position?: IWarningPosition;
  origin: string;
}

export interface IWarningPosition {
  section?: string;
  entityId?: string;
  actantId?: string;
}
