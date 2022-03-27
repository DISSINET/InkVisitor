import { EntityClass } from "../enums";
import { IEntity } from "./entity";

export interface IResource extends IEntity {
  class: EntityClass.Resource;
  data: {
    url: string;
    partValueLabel: string;
    partValueBaseURL: string;
  };
}
