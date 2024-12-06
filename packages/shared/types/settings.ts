export interface ISetting {
  id: SettingsKey;
  value: unknown;
  public: boolean;
}

export interface ISettingGroup {
  id: string;
  settings: ISetting[];
}

// ADAM: needed to change to string as it was not casting string to this properly
// export enum SettingsKey {}
export type SettingsKey = string;
