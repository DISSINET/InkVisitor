import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

export interface IConcept extends IEntity {
  class: EntityEnums.Class.Concept;
  data: IConceptData;
}

export interface IConceptData {
  pos: EntityEnums.ConceptPartOfSpeech;
}
