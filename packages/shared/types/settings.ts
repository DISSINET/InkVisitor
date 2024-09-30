export interface ISetting {
  id: SettingsKey;
  value: unknown;
}

export enum SettingsKey {
  OWNER = "owner",
}
