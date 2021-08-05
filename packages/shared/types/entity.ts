import { IActant } from "./";
import {
  EntityActantType,
  ActantType,
  ActantStatus,
  ActantLogicalType,
} from "../enums";

export interface IEntity extends IActant {
  class: EntityActantType;
  data: {
    logicalType: ActantLogicalType;
  };
}
