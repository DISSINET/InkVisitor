import { IRequest } from "src/custom_typings/request";

export interface IDocument {
  id: string;
  content: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// lookup -> if no filter applied (not implemented now)
export interface IResponseDocument {
  id: string;
  title: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
  referencedEntityIds: string[];
}

// detail -> get
export interface IResponseDocumentDetail extends IResponseDocument {
  content: string;
}

export type IRequestDocument = IRequest<{ documentId?: string }>;
export type IRequestDocuments = IRequest<{}, {}, { ids?: string[] }>;
