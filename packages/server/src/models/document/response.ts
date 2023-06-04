import { IDocument, IResponseDocument } from "@shared/types";
import Document from "./document";

export default class ResponseDocument
  extends Document
  implements IResponseDocument
{
  referencedEntityIds: string[];

  constructor(data: Partial<IDocument>) {
    super(data);
    this.referencedEntityIds = this.findReferencedEntityIds();
  }

  findReferencedEntityIds(): string[] {
    const regex = /<([\w-]+)>/g;
    let match;

    const entities = [];

    while ((match = regex.exec(this.content)) !== null) {
      entities.push(match[1]);
    }
    return entities;
  }
}
