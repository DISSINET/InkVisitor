import { ValidationKey } from "@shared/enums/warning";

export interface ISetting {
  id: SettingsKey;
  value: unknown;
  public: boolean;
}

export interface ISettingGroup {
  id: string;
  settings: ISetting[];
}

export type SettingsKey = string;
