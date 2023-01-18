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
  territoryId?: string;
  subTerritorySearch?: boolean;
  onlyTemplates?: boolean;
  usedTemplate?: string;
  status?: EntityEnums.Status;
  createdDate?: Date;
  updatedDate?: Date;
}

export class RequestSearch {
  class?: EntityEnums.Class;
  label?: string;
  entityIds?: string[];
  cooccurrenceId?: string;
  territoryId?: string;
  subTerritorySearch?: boolean;
  excluded?: EntityEnums.Class[];
  onlyTemplates?: boolean;
  usedTemplate?: string;
  status?: EntityEnums.Status;
  createdDate?: Date;
  updatedDate?: Date;

  constructor(requestData: IRequestSearch) {
    this.class = requestData.class;
    this.label = requestData.label;
    this.status = requestData.status
    
    this.createdDate = requestData.createdDate
    this.updatedDate = requestData.updatedDate

    this.cooccurrenceId =
      requestData.cooccurrenceId ||
      (requestData as any).relatedEntityId ||
      false;

    this.entityIds = requestData.entityIds;

    if (requestData.excluded) {
      if (requestData.excluded.constructor.name === "String") {
        this.excluded = [requestData.excluded as any];
      } else {
        this.excluded = requestData.excluded;
      }
    }

    this.onlyTemplates = !!requestData.onlyTemplates;
    this.usedTemplate = requestData.usedTemplate || undefined;
    this.territoryId = requestData.territoryId || undefined;
    this.subTerritorySearch = !!requestData.subTerritorySearch;
  }

  /**
   * Tests tests if the object can be used for querying
   * @returns {(Error|void)} error instance in case of a problem - not throwed
   */
  validate(): Error | void {
    if (this.class && !EnumValidators.IsValidEntityClass(this.class)) {
      return new BadParams("invalid 'class' value");
    }

    if (
      this.excluded !== undefined &&
      this.excluded.constructor.name !== "Array"
    ) {
      return new BadParams("excluded needs to be an array");
    }

    if (
      this.entityIds !== undefined &&
      this.entityIds.constructor.name !== "Array"
    ) {
      return new BadParams("entityIds needs to be an array");
    }

    // check dates
    if (
      this.createdDate !== undefined &&
      this.createdDate.constructor.name !== "Date"
    ) {
      return new BadParams("createdDate needs to be a date");
    }
    if (
      this.updatedDate !== undefined &&
      this.updatedDate.constructor.name !== "Date"
    ) {
      return new BadParams("updatedDate needs to be a date");
    }


    if (this.subTerritorySearch && !this.territoryId) {
      return new BadParams(
        "subTerritorySearch needs valid territoryId to be set"
      );
    }

    if (
      !this.label &&
      !this.class &&
      !this.onlyTemplates &&
      !this.cooccurrenceId &&
      !this.usedTemplate &&
      !this.territoryId &&
      !this.status &&
      !this.createdDate &&
      !this.updatedDate &&
      (this.entityIds === undefined || !this.entityIds.length)
    ) {
      return new BadParams(
        "one of the search field has to be set"
      );
    }

    return;
  }
}
