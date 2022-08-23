import { IProp } from ".";
import { EntityEnums } from "../enums";

export interface IActant {
  id: string;
  class: EntityEnums.Class;
  data: any;
  label: string;
  detail: string;
  status: EntityEnums.Status;
  language: EntityEnums.Language;
  notes: string[];
  props: IProp[];
}
