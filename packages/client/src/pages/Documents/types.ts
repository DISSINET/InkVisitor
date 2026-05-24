import { IDocument, IResponseEntity } from "@inkvisitor/shared/types";

export type DocumentWithResource = {
  document: IDocument;
  resource: false | IResponseEntity;
};
export type DocumentSortField = "documentName" | "resourceLabel" | "anchorCount";
export type DocumentSortDirection = "asc" | "desc";

export type DocumentSortState = {
  field: DocumentSortField;
  direction: DocumentSortDirection;
} | null;
