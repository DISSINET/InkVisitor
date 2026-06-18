import { EntityEnums } from "../enums";
import { EnumValidators } from "../enums/validators";
import { BadParams } from "./errors";

export interface IRequestSearch {
  class?: EntityEnums.Class | EntityEnums.Extension.Any;
  excluded?: EntityEnums.Class[];
  label?: string;
  labelOrId?: string;
  entityIds?: string[];
  cooccurrenceId?: string;
  territoryId?: string;
  subTerritorySearch?: boolean;
  language?: EntityEnums.Language;
  onlyTemplates?: boolean;
  usedTemplate?: string;
  status?: EntityEnums.Status;
  createdDate?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedDate?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  createdBy?: string;
  updatedBy?: string;
  resourceHasDocument?: boolean;
  haveReferenceTo?: string;
  isRootInvalid?: IRequestSearchRootValidity;
  editedBy?: string;
}

export enum IRequestSearchRootValidity {
  Any = "Any",
  Valid = "Valid",
  Invalid = "Invalid",
}

export class RequestSearch {
  class?: EntityEnums.Class | EntityEnums.Extension.Any;
  label?: string;
  labelOrId?: string;
  entityIds?: string[];
  cooccurrenceId?: string;
  territoryId?: string;
  subTerritorySearch?: boolean;
  excluded?: EntityEnums.Class[];
  language?: EntityEnums.Language;
  onlyTemplates?: boolean;
  usedTemplate?: string;
  status?: EntityEnums.Status;
  createdDate?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedDate?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  createdBy?: string;
  updatedBy?: string;
  resourceHasDocument?: boolean;
  haveReferenceTo?: string;
  isRootInvalid?: IRequestSearchRootValidity;
  editedBy?: string;

  constructor(requestData: IRequestSearch) {
    this.class = requestData.class;
    this.label = requestData.label;
    this.labelOrId = requestData.labelOrId;
    this.status = requestData.status;

    if (requestData.createdDate) {
      this.createdDate = new Date(requestData.createdDate || "");
    }

    if (requestData.createdAfter) {
      this.createdAfter = new Date(requestData.createdAfter || "");
    }

    if (requestData.createdBefore) {
      this.createdBefore = new Date(requestData.createdBefore || "");
    }

    if (requestData.updatedDate) {
      this.updatedDate = new Date(requestData.updatedDate || "");
    }

    if (requestData.updatedAfter) {
      this.updatedAfter = new Date(requestData.updatedAfter || "");
    }

    if (requestData.updatedBefore) {
      this.updatedBefore = new Date(requestData.updatedBefore || "");
    }

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

    this.onlyTemplates = Boolean(requestData.onlyTemplates);
    this.usedTemplate = requestData.usedTemplate ?? undefined;
    this.territoryId = requestData.territoryId ?? undefined;
    this.language = requestData.language ?? undefined;
    this.subTerritorySearch = Boolean(requestData.subTerritorySearch);
    this.resourceHasDocument = Boolean(requestData.resourceHasDocument);
    this.haveReferenceTo = requestData.haveReferenceTo ?? undefined;
    this.isRootInvalid =
      requestData.isRootInvalid ?? IRequestSearchRootValidity.Any;
    this.createdBy = requestData.createdBy ?? undefined;
    this.updatedBy = requestData.updatedBy ?? undefined;
    this.editedBy = requestData.editedBy ?? undefined;
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
      // attempt to fix the string => array with one element
      if (typeof this.excluded === "string") {
        this.excluded = (this.excluded as string).split(
          ","
        ) as EntityEnums.Class[];
      } else {
        return new BadParams("excluded needs to be an array");
      }
    }

    if (
      this.entityIds !== undefined &&
      this.entityIds.constructor.name !== "Array"
    ) {
      // attempt to fix the string => array with one element
      if (typeof this.entityIds === "string") {
        this.entityIds = (this.entityIds as string).split(",");
      } else {
        return new BadParams("entityIds needs to be an array");
      }
    }

    // check dates
    if (
      this.createdDate !== undefined &&
      this.createdDate.constructor.name !== "Date"
    ) {
      return new BadParams("createdDate needs to be a date");
    }
    if (
      this.createdAfter !== undefined &&
      this.createdAfter.constructor.name !== "Date"
    ) {
      return new BadParams("createdAfter needs to be a date");
    }
    if (
      this.createdBefore !== undefined &&
      this.createdBefore.constructor.name !== "Date"
    ) {
      return new BadParams("createdBefore needs to be a date");
    }
    if (
      this.updatedDate !== undefined &&
      this.updatedDate.constructor.name !== "Date"
    ) {
      return new BadParams("updatedDate needs to be a date");
    }
    if (
      this.updatedAfter !== undefined &&
      this.updatedAfter.constructor.name !== "Date"
    ) {
      return new BadParams("updatedAfter needs to be a date");
    }
    if (
      this.updatedBefore !== undefined &&
      this.updatedBefore.constructor.name !== "Date"
    ) {
      return new BadParams("updatedBefore needs to be a date");
    }

    if (this.subTerritorySearch && !this.territoryId) {
      return new BadParams(
        "subTerritorySearch needs valid territoryId to be set"
      );
    }

    if (
      !this.label &&
      !this.labelOrId &&
      !this.class &&
      !this.onlyTemplates &&
      !this.resourceHasDocument &&
      !this.cooccurrenceId &&
      !this.usedTemplate &&
      !this.territoryId &&
      !this.status &&
      !this.createdBy &&
      !this.updatedBy &&
      !this.language &&
      !this.createdDate &&
      !this.createdAfter &&
      !this.createdBefore &&
      !this.updatedDate &&
      !this.updatedAfter &&
      !this.updatedBefore &&
      (this.entityIds === undefined || !this.entityIds.length) &&
      !this.haveReferenceTo
    ) {
      return new BadParams("Provide more search parameters");
    }

    return;
  }
}
