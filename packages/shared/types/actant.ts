import { ActantType, ActantStatus, ActantLogicalType } from "../enums";

export interface IActant {
  id: string;
  class: ActantType;
  data: object;
  label: string;
  label_extended: string;
  status: ActantStatus;
  language: string;
  notes: string[];
  recommendations: string[];
}
