import { ActantType, ActantStatus, ActantLogicalType } from "../enums";

export interface IActant {
  id: string;
  class: ActantType;
  data: object;
  label: string;
  detail: string;
  status: ActantStatus;
  language: string;
  notes: string[];
}
