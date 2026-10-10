import { IDocument, IResponseTree } from "@inkvisitor/shared/types";

/**
 * Ids of the territories encapsulating a document: for each document, every
 * anchored territory with no anchored ancestor in that document. Only documents
 * linked to a resource count, since the annotator reaches a territory's
 * document through a resource.
 */
export const getDocumentTerritoryIds = (
  tree: IResponseTree | undefined,
  documents: Pick<IDocument, "id" | "entityIds">[] | undefined,
  resources: { data: { documentId?: string } }[] | undefined,
): Set<string> => {
  const documentTerritoryIds = new Set<string>();
  if (!tree || !documents || !resources) {
    return documentTerritoryIds;
  }

  const linkedDocumentIds = new Set(
    resources.map((resource) => resource.data.documentId).filter(Boolean),
  );

  const pathsById = new Map<string, string[]>();
  const collectPaths = (node: IResponseTree) => {
    pathsById.set(node.territory.id, node.path);
    node.children.forEach(collectPaths);
  };
  collectPaths(tree);

  documents.forEach((document) => {
    if (!linkedDocumentIds.has(document.id)) {
      return;
    }
    const anchoredIds = new Set(
      (document.entityIds.T ?? []).filter((territoryId) => pathsById.has(territoryId)),
    );
    anchoredIds.forEach((territoryId) => {
      const path = pathsById.get(territoryId)!;
      if (!path.some((ancestorId) => anchoredIds.has(ancestorId))) {
        documentTerritoryIds.add(territoryId);
      }
    });
  });

  return documentTerritoryIds;
};
