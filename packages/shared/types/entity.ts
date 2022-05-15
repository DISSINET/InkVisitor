import { IProp } from ".";
import { EntityClass, EntityStatus, Language } from "../enums";
import { IReference } from "./reference";

export interface IEntity {
  id: string;
  legacyId?: string;
  class: EntityClass;
  status: EntityStatus;
  data: any;
  label: string;
  detail: string;
  language: Language;
  notes: string[];
  props: IProp[];
  references: IReference[];
  isTemplate?: boolean;
  usedTemplate?: string;
  templateData?: object;
}
