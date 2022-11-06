import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

export interface IConcept extends IEntity {
  class: EntityEnums.Class.Concept;
  data: {};
}
