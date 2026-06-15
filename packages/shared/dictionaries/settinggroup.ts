import { SettingsKey } from "@inkvisitor/shared/types/settings";
import { globalValidationsDict } from "./../enums/warning";

export const SettingGroupDict: { id: string; value: SettingsKey[] }[] = [
  {
    id: "validations",
    value: Object.keys(globalValidationsDict),
  },
  {
    id: "app",
    value: ["env"],
  },
];
