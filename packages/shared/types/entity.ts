import { IProp } from ".";
import { EntityEnums } from "../enums";
import { IReference } from "./reference";

export interface IEntity {
  id: string;
  legacyId?: string;
  class: EntityEnums.Class;
  status: EntityEnums.Status;
  data: any;
  label: string;
  detail: string;
  language: EntityEnums.Language;
  notes: string[];
  props: IProp[];
  references: IReference[];
  isTemplate?: boolean;
  usedTemplate?: string;
  templateData?: object;
}
