import { EntityEnums } from "@shared/enums";

export interface IDocument {
  id: string;
  content: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// lookup -> getAll
export interface IResponseDocument {
  id: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  referencedEntityIds: Record<EntityEnums.Class, string[]>;
}

// detail -> get
export interface IResponseDocumentDetail extends IResponseDocument {
  content: string;
}
