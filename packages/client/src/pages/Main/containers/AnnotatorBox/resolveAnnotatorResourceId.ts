import { IDocument, IResponseEntity } from "@inkvisitor/shared/types";

/**
 * Resolve which resource's document anchors the given territory. Prefers a
 * resource whose document anchors the territory directly; otherwise walks the
 * territory path from the closest ancestor outward. Returns `false` when no
 * resource anchors the territory or any of its ancestors — the caller uses this
 * to clear a stale selection when switching to a territory without a document.
 */
export const resolveAnnotatorResourceId = (
  territoryId: string,
  selectedTerritoryPath: string[],
  resources: IResponseEntity[],
  documents: IDocument[]
): string | false => {
  const findAnchoringResource = (tId: string) =>
    resources.find((resource) => {
      if (!resource.data.documentId) return false;
      const document = documents.find((d) => d.id === resource.data.documentId);
      return document?.entityIds.T.includes(tId) ?? false;
    });

  let resourceWithAnchor = findAnchoringResource(territoryId);

  if (!resourceWithAnchor) {
    for (let i = selectedTerritoryPath.length - 1; i > 0; i--) {
      resourceWithAnchor = findAnchoringResource(selectedTerritoryPath[i]);
      if (resourceWithAnchor) break;
    }
  }

  return resourceWithAnchor ? resourceWithAnchor.id : false;
};
