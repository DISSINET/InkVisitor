import { IProp } from ".";
import { EntityStatus, EntityClass, Language } from "../enums";

export interface IActant {
  id: string;
  class: EntityClass;
  data: any;
  label: string;
  detail: string;
  status: EntityStatus;
  language: Language;
  notes: string[];
  props: IProp[];
}
