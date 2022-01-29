import { IProp } from ".";
import { ActantStatus, EntityClass, Language } from "../enums";

export interface IActant {
  id: string;
  class: EntityClass;
  data: any;
  label: string;
  detail: string;
  status: ActantStatus;
  language: Language;
  notes: string[];
  props: IProp[];
}
