import { EntityEnums } from "@shared/enums";

// just meta information + title...without content
export interface IDocumentMeta {
  id: string;
  title: string;
  entityIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// added content for completion
export interface IDocument extends IDocumentMeta {
  content: string;
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
