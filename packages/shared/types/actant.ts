import { ActantType, ActantStatus, ActantLogicalType } from "../enums";

export interface IActant {
  id: string;
  class: ActantType;
  label: string;
  label_extended: string;
  data: object;
  status: ActantStatus;
  logicalType: ActantLogicalType;
  language: string;
  notes: string[];
  recommendations: string[];
}
