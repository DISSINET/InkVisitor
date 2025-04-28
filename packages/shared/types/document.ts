import { EntityEnums } from "@shared/enums";

// just meta information + title...without content
export type IDocumentMeta = Omit<IDocument, "content">;

// added content for completion
export interface IDocument {
  id: string;
  title: string;
  content: string;
  entityIds: Record<EntityEnums.Class, string[]>;
  createdAt?: Date;
  updatedAt?: Date;
}