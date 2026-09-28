import { IDocument, IResponseTree } from "@inkvisitor/shared/types";
import { TerritoryDocumentMark } from "types";

/**
 * Marks the territories anchored in documents. The topmost anchored territory
 * of a document encapsulates the whole document and gets "document"; the
 * anchored territories below it get "anchor". A territory that is topmost in
 * one document and nested in another keeps "document".
 */
export const getTerritoryDocumentMarks = (
  tree: IResponseTree | undefined,
  documents: Pick<IDocument, "entityIds">[] | undefined,
): Map<string, TerritoryDocumentMark> => {
  const marks = new Map<string, TerritoryDocumentMark>();
  if (!tree || !documents) {
    return marks;
  }

  const pathsById = new Map<string, string[]>();
  const collectPaths = (node: IResponseTree) => {
    pathsById.set(node.territory.id, node.path);
    node.children.forEach(collectPaths);
  };
  collectPaths(tree);

  documents.forEach((document) => {
    const anchoredIds = new Set(document.entityIds.T ?? []);
    anchoredIds.forEach((territoryId) => {
      const path = pathsById.get(territoryId);
      if (!path) {
        return;
      }
      const isNested = path.some((ancestorId) => anchoredIds.has(ancestorId));
      if (!isNested) {
        marks.set(territoryId, "document");
      } else if (!marks.has(territoryId)) {
        marks.set(territoryId, "anchor");
      }
    });
  });

  return marks;
};
