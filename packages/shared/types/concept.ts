import { IActant, IProp } from ".";
import { EntityStatus, EntityClass, Language } from "../enums";

export interface IConcept extends IActant {
  data: {
    status: EntityStatus;
  };
}
