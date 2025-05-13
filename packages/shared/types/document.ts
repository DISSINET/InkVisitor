import { EntityEnums } from "@shared/enums";

// just meta information + title...without content
export type IDocumentMeta = Omit<IDocument, "content">;

export interface IAnchorsNode {
  anchor: string;  // The tag name (entity id)
  content: string; // Text content within the tag
  class: EntityEnums.Class;
  children: IAnchorsNode[]; // Nested children (other nodes)
}

// added content for completion
export interface IDocument {
  id: string;
  title: string;
  content: string;
  entityIds: Record<EntityEnums.Class, string[]>;
  anchors: IAnchorsNode[];
  createdAt?: Date;
  updatedAt?: Date;
} 
