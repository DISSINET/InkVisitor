import { IDocument, IResponseTree } from "@inkvisitor/shared/types";

/**
 * Ids of the territories encapsulating a document: for each document, its
 * anchored territory highest in the tree. Only documents linked to a resource
 * count, since the annotator reaches a territory's document through a resource.
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

  const lvlsById = new Map<string, number>();
  const collectLvls = (node: IResponseTree) => {
    lvlsById.set(node.territory.id, node.lvl);
    node.children.forEach(collectLvls);
  };
  collectLvls(tree);

  documents.forEach((document) => {
    if (!linkedDocumentIds.has(document.id)) {
      return;
    }
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
