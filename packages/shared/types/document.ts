export interface IDocument {
  id: string;
  content: string;
  title: string;
  createdAt: Date;
  updatedAt?: Date;
}
