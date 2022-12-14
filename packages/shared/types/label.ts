import { EntityEnums } from "@shared/enums";

export interface ILabel {
  id: string;
  value: string;
  lang: EntityEnums.Language;
}
