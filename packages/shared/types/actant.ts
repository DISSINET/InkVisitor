import { ActantType, ActantStatus, Language } from "../enums";

export interface IActant {
  id: string;
  class: ActantType;
  data: any;
  label: string;
  detail: string;
  status: ActantStatus;
  language: Language[];
  notes: string[];
}
