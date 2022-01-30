import { IProp } from ".";
import { EntityClass, Language } from "../enums";

export interface IActant {
  id: string;
  class: EntityClass;
  data: any;
  label: string;
  detail: string;
  language: Language;
  notes: string[];
  props: IProp[];
}
