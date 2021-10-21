/**
 * type of the /user endpoint response
 */

import { ActantType, isValidActantType } from "../enums";
import { BadParams } from "./errors";

export interface IResponseSearch {
  class: ActantType | false;
  label: string | false;
  actantId: string | false;
}

export class RequestSearch implements IResponseSearch {
  class: ActantType | false;
  label: string | false;
  actantId: string | false;

  constructor(requestData: IResponseSearch) {
    this.class = requestData.class || false;
    this.label = requestData.label || false;
    this.actantId = requestData.actantId || false;
  }

  validate(): Error | void {
    if (this.class !== false && !isValidActantType(this.class)) {
      return new BadParams("invalid 'class' value");
    }

    if (!this.label && !this.actantId) {
      return new BadParams("at least some search field has to be set");
    }

    return;
  }
}
