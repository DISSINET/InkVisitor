import { EntityEnums } from "@inkvisitor/shared/enums";

// just meta information + title...without content
export type IDocumentMeta = Omit<IDocument, "content">;

export interface IAnchorsNode {
  anchor: string; // The tag name (entity id)
  content: string; // Text content within the tag
  class: EntityEnums.Class;
  children: IAnchorsNode[]; // Nested children (other nodes)
  indexStart: number; // Start index of the anchor in the document
  indexEnd: number; // End index of the anchor in the document
}

// an anchor whose opening tag no closing tag ends (indexEnd -1); a node stored
// without indexEnd counts as paired
export const isOrphanedAnchor = (node: Pick<IAnchorsNode, "indexEnd">): boolean =>
  node.indexEnd === -1;

// one document of a batch export - content already stripped of the anchors
// whose entity class was left out
export interface IDocumentExport {
  id: string;
  title: string;
  content: string;
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
