import { IActant } from ".";
import { EntityClass } from "../enums";

export interface IResource extends IActant {
  class: EntityClass.Resource;
  data: {
    link: string;
  };
}
