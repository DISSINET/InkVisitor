import { IDocument, IResponseEntity } from "@inkvisitor/shared/types";
import { getEntityLabel } from "utils/utils";
import { DocumentSortDirection, DocumentSortField, DocumentWithResource } from "./types";

const getDocumentAnchorCount = (document: IDocument): number =>
  Object.values(document.entityIds).reduce(
    (total, entityIds) => total + (Array.isArray(entityIds) ? entityIds.length : 0),
    0
  );

const getDocumentSortName = (document: IDocument): string => document.title?.trim() || document.id;

const getResourceSortLabel = (resource: false | IResponseEntity): string =>
  resource ? getEntityLabel(resource) : "";

export const compareDocuments = (
  a: DocumentWithResource,
  b: DocumentWithResource,
  sortField: DocumentSortField,
  sortDirection: DocumentSortDirection
): number => {
  const direction = sortDirection === "asc" ? 1 : -1;

  if (sortField === "documentName") {
    return (
      getDocumentSortName(a.document).localeCompare(getDocumentSortName(b.document), undefined, {
        sensitivity: "base",
      }) * direction
    );
  }

  if (sortField === "resourceLabel") {
    const hasResourceA = Boolean(a.resource);
    const hasResourceB = Boolean(b.resource);
    if (!hasResourceA && hasResourceB) return direction;
    if (hasResourceA && !hasResourceB) return -direction;

    return (
      getResourceSortLabel(a.resource).localeCompare(getResourceSortLabel(b.resource), undefined, {
        sensitivity: "base",
      }) * direction
    );
  }

  const anchorDiff = getDocumentAnchorCount(a.document) - getDocumentAnchorCount(b.document);
  // ↑ asc = highest first; ↓ desc = lowest first (inverse of text columns)
  const anchorDirection = sortDirection === "asc" ? -1 : 1;
  if (anchorDiff !== 0) {
    return anchorDiff * anchorDirection;
  }

  return (
    getDocumentSortName(a.document).localeCompare(getDocumentSortName(b.document), undefined, {
      sensitivity: "base",
    }) * direction
  );
};
