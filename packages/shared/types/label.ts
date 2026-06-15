import { EntityEnums } from "@inkvisitor/shared/enums";

export interface ILabel {
  id: string;
  value: string;
  lang: EntityEnums.Language;
}
