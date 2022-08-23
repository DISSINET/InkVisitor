import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

export interface IResource extends IEntity {
  class: EntityEnums.Class.Resource;
  data: {
    url: string;
    partValueLabel: string;
    partValueBaseURL: string;
  };
}
