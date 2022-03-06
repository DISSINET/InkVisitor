import { EntityStatus, EntityClass, Language } from "../enums";
import { IEntity } from "./entity";

export interface IConcept extends IEntity {
  class: EntityClass.Concept;
  data: {};
}
