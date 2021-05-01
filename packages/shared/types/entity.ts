import { IActant } from "./";
import { EntityActantType } from "../enums";

export interface IEntity extends IActant {
  class: EntityActantType;
  data: {};
}
