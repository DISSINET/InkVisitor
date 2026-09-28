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

  const lvlsById = new Map<string, number>();
  const collectLvls = (node: IResponseTree) => {
    lvlsById.set(node.territory.id, node.lvl);
    node.children.forEach(collectLvls);
  };
  collectLvls(tree);

  documents.forEach((document) => {
    const anchoredIds = (document.entityIds.T ?? []).filter((territoryId) =>
      lvlsById.has(territoryId),
    );
    if (anchoredIds.length === 0) {
      return;
    }

    // the first of the shallowest territories wins a tie
    const highestId = anchoredIds.reduce((highest, territoryId) =>
      lvlsById.get(territoryId)! < lvlsById.get(highest)! ? territoryId : highest,
    );
    documentTerritoryIds.add(highestId);
  });

  return documentTerritoryIds;
};
