/**
 * Deprecated
 */

import { EntityEnums } from "../enums";
import { EnumValidators } from "../enums/validators";
import { BadParams } from "./errors";

export interface IRequestSearch {
  class?: EntityEnums.Class;
  excluded?: EntityEnums.Class[];
  label?: string;
  entityIds?: string[];
  cooccurrenceId?: string;
  onlyTemplates?: boolean;
  usedTemplate?: string;
}

export class RequestSearch {
  class?: EntityEnums.Class;
  label?: string;
  entityIds?: string[];
  cooccurrenceId?: string;
  excluded?: EntityEnums.Class[];
  onlyTemplates?: boolean;
  usedTemplate?: string;

  constructor(requestData: IRequestSearch & { excluded?: EntityEnums.Class[] }) {
    this.class = requestData.class;
    this.label = requestData.label;
    this.cooccurrenceId =
      requestData.cooccurrenceId ||
      (requestData as any).relatedEntityId ||
      false;

    this.entityIds = requestData.entityIds || [];

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
    if (this.class && !EnumValidators.IsValidEntityClass(this.class)) {
      return new BadParams("invalid 'class' value");
    }

    if (
      !this.label &&
      !this.class &&
      !this.onlyTemplates &&
      !this.usedTemplate &&
      (typeof this.entityIds !== "object" || !this.entityIds.length)
    ) {
      return new BadParams(
        "label, class, onlyTemplates, usedTemplate or entityIds field has to be set"
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
