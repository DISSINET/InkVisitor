export interface IDocument {
  id: string;
  content: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// lookup -> getAll
export interface IResponseDocument {
  id: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  referencedEntityIds: string[];
}

// detail -> get
export interface IResponseDocumentDetail extends IResponseDocument {
  content: string;
}
