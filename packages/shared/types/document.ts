import { EntityEnums } from "@shared/enums";

// just meta information + title...without content
export type IDocumentMeta = Omit<IDocument, "content">;

// added content for completion
export interface IDocument {
  id: string;
  title: string;
  content: string;
  entityIds: string[];
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
