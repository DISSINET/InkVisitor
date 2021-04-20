import { ActantType } from "../enums";

export interface IActant {
  id: string;
  class: ActantType;
  label: string;
  data: object;
}
