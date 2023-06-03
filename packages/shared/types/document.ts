export interface IDocument {
  id: string;
  content: string;
  title: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IResponseDocument {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IResponseDocumentDetail extends IDocument {
}
