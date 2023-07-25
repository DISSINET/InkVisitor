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

export interface IRequestDocumentParams { documentId?: string };
export interface IRequestDocumentsQuery { ids?: string[] };
