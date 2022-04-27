/**
 * Deprecated
 */

import { EntityClass, isValidEntityClass } from "../enums";
import { BadParams } from "./errors";

export interface IResponseSearch {
  class: EntityClass | false;
  label: string | false;
  entityId: string | false;
  onlyTemplates?: boolean;
  usedTemplate?: string;
}

export class RequestSearch implements IResponseSearch {
  class: EntityClass | false;
  label: string | false;
  entityId: string | false;
  excluded?: EntityClass[];
  onlyTemplates?: boolean;
  usedTemplate?: string;

  constructor(requestData: IResponseSearch & { excluded?: EntityClass[] }) {
    this.class = requestData.class || false;
    this.label = requestData.label || false;
    this.entityId =
      requestData.entityId || (requestData as any).relatedEntityId || false;

    if (requestData.excluded) {
      //@ts-ignore
      if (requestData.excluded.constructor.name === "String") {
        requestData.excluded = [requestData.excluded as any];
      }
      this.excluded = requestData.excluded;
    }

    this.onlyTemplates = requestData.onlyTemplates || undefined;
    this.usedTemplate = requestData.usedTemplate || undefined;
  }

  validate(): Error | void {
    if (this.class !== false && !isValidEntityClass(this.class)) {
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

    if (!this.label && !this.entityId) {
      return new BadParams("label or entityId has to be set");
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
