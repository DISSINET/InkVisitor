export interface ISetting {
  id: SettingsKey;
  value: unknown;
  public: boolean;
}

export enum SettingsKey {
  OWNER = "owner",
}
