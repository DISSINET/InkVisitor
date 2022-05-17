/**
 * Deprecated
 */

import { EntityClass, isValidEntityClass } from "../enums";
import { BadParams } from "./errors";

export interface IRequestSearch {
  class?: EntityClass;
  excluded?: EntityClass[];
  label?: string;
  entityId?: string;
  onlyTemplates?: boolean;
  usedTemplate?: string;
}

export class RequestSearch {
  class?: EntityClass;
  label?: string;
  entityId?: string;
  excluded?: EntityClass[];
  onlyTemplates?: boolean;
  usedTemplate?: string;

  constructor(requestData: IRequestSearch & { excluded?: EntityClass[] }) {
    this.class = requestData.class;
    this.label = requestData.label;
    this.entityId =
      requestData.entityId || (requestData as any).relatedEntityId || false;

    if (requestData.excluded) {
      if (requestData.excluded.constructor.name === "String") {
        this.excluded = [requestData.excluded as any];
      } else {
        this.excluded = requestData.excluded;
      }
    }

    this.onlyTemplates = requestData.onlyTemplates || undefined;
    this.usedTemplate = requestData.usedTemplate || undefined;
  }

  validate(): Error | void {
    if (this.class && !isValidEntityClass(this.class)) {
      return new BadParams("invalid 'class' value");
    }

    if (
      !this.label &&
      !this.class &&
      !this.onlyTemplates &&
      !this.usedTemplate
    ) {
      return new BadParams(
        "label, class, onlyTemplates or usedTemplate has to be set"
      );
    }

    if (
      this.excluded !== undefined &&
      this.excluded.constructor.name !== "Array"
    ) {
      return new BadParams("excluded needs to be array");
    }

    return;
  }
}
