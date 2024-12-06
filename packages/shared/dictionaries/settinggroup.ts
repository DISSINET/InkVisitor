import { SettingsKey } from "@shared/types/settings";
import { globalValidationsDict } from "./../enums/warning";

export const SettingGroupDict: { id: string; value: SettingsKey[] }[] = [
  {
    id: "validations",
    value: Object.keys(globalValidationsDict).map(
      (key) => `validation_${key}` as SettingsKey
    ),
  },
];
