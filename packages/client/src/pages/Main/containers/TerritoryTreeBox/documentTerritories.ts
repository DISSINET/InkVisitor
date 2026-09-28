import { IDocument, IResponseTree } from "@inkvisitor/shared/types";

/**
 * Ids of the territories encapsulating a document: for each document, its
 * anchored territory highest in the tree.
 */
export const getDocumentTerritoryIds = (
  tree: IResponseTree | undefined,
  documents: Pick<IDocument, "entityIds">[] | undefined,
): Set<string> => {
  const documentTerritoryIds = new Set<string>();
  if (!tree || !documents) {
    return documentTerritoryIds;
  }

  const pathsById = new Map<string, string[]>();
  const collectPaths = (node: IResponseTree) => {
    pathsById.set(node.territory.id, node.path);
    node.children.forEach(collectPaths);
  };
  collectPaths(tree);

  documents.forEach((document) => {
    const anchoredIds = (document.entityIds.T ?? []).filter((territoryId) =>
      pathsById.has(territoryId),
    );
    if (anchoredIds.length === 0) {
      return;
    }

    // the first of the shallowest territories wins a tie
    const highestId = anchoredIds.reduce((highest, territoryId) =>
      pathsById.get(territoryId)!.length < pathsById.get(highest)!.length ? territoryId : highest,
    );
    documentTerritoryIds.add(highestId);
  });

  return documentTerritoryIds;
};
