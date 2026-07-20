import { IProp } from ".";
import { EntityEnums } from "../enums";
import { IReference } from "./reference";

export interface IEntity {
  id: string;
  legacyId?: string;
  class: EntityEnums.Class;
  status: EntityEnums.Status;
  data: any;
  labels: string[];
  detail: string;
  language: EntityEnums.Language;
  notes: string[];
  props: IProp[];
  references: IReference[];
  isTemplate?: boolean;
  usedTemplate?: string;
  templateData?: object;
  createdAt?: Date;
  updatedAt?: Date;
  // response-only, never persisted: content of each document anchor pointing
  // at this entity (only filled for Statement-class entities in response
  // entities maps / lists; see Entity.applyAnchorTexts on the server)
  anchorTexts?: string[];
}

export const entityAllowedFields: Record<keyof IEntity, boolean> = {
  id: true,
  legacyId: true,
  class: true,
  status: true,
  data: true,
  labels: true,
  detail: true,
  language: true,
  notes: true,
  props: true,
  references: true,
  isTemplate: true,
  usedTemplate: true,
  templateData: true,
  createdAt: true,
  updatedAt: true,
  anchorTexts: false, // response-only computed field, not writable
};
