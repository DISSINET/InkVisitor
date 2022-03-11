/**
 * Deprecated
 */

import { EntityClass, isValidEntityClass } from "../enums";
import { BadParams } from "./errors";

export interface IResponseSearch {
  class: EntityClass | false;
  label: string | false;
  entityId: string | false;
}

export class RequestSearch implements IResponseSearch {
  class: EntityClass | false;
  label: string | false;
  entityId: string | false;
  excluded?: EntityClass[];

  constructor(requestData: IResponseSearch & { excluded?: EntityClass[] }) {
    this.class = requestData.class || false;
    this.label = requestData.label || false;
    this.entityId = requestData.entityId || false;
    if (requestData.excluded) {
      //@ts-ignore
      if (requestData.excluded.constructor.name === "String") {
        requestData.excluded = [requestData.excluded as any];
      }
      this.excluded = requestData.excluded;
    }
  }

  validate(): Error | void {
    if (this.class !== false && !isValidEntityClass(this.class)) {
      return new BadParams("invalid 'class' value");
    }

    if (!this.label && !this.entityId) {
      return new BadParams("at least some search field has to be set");
    }

    return;
  }
}
