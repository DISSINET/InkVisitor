import { IActant } from ".";
import { ActantType } from "../enums";

export interface IResource extends IActant {
  class: ActantType.Resource;
  data: {
    content: string;
    link: string;
    type: string;
  };
}
