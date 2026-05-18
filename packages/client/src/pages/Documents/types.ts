import { IDocument, IResponseEntity } from "@shared/types";

export type DocumentWithResource = {
  document: IDocument;
  resource: false | IResponseEntity;
};
export type DocumentSortField = "documentName" | "resourceLabel" | "anchorCount";
export type DocumentSortDirection = "asc" | "desc";
