import { IProp } from ".";
import { EntityClass, EntityStatus, Language } from "../enums";

export interface IEntity {
  id: string;
  _legacyId?: string;
  class: EntityClass;
  status: EntityStatus;
  data: any;
  label: string;
  detail: string;
  language: Language;
  notes: string[];
  props: IProp[];
  references: IEntityReference[];
  isTemplate?: boolean;
  usedTemplate?: boolean;
  templateData?: object;
}

export interface IEntityReference {
  id: string;
  source: string;
  value: string;
}
