import { EntityEnums } from "@shared/enums";

export interface IAnchorsNode {
  anchor: string; // The tag name (entity id)
  content: string; // Text content within the tag
  class: EntityEnums.Class;
  children: IAnchorsNode[]; // Nested children (other nodes)
  indexStart: number; // Start index of the anchor in the document
  indexEnd: number; // End index of the anchor in the document
}

// added content for completion
export interface IDocument {
  id: string;
  title: string;
  content: string;
  entityIds: Record<EntityEnums.Class, string[]>;
  createdAt?: Date;
  updatedAt?: Date;
  anchors?: IAnchorsNode[];
}
