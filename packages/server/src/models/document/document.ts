import { IDbModel } from "@models/common";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { IDocument } from "@shared/types";
import { UserEnums } from "@shared/enums";
import { InternalServerError, ModelNotValidError } from "@shared/types/errors";
import User from "@models/user/user";

class TreeNode {
  tag: string;
  content: string;
  children: TreeNode[];

  constructor(tag: string, content: string) {
      this.tag = tag;
      this.content = content;
      this.children = [];
  }

      // Method to return all unique tags as a string array
      getAllUniqueTags(): string[] {
        const tags: string[] = [];
        this.collectTags(tags);
        return [...new Set(tags)]; // Filter out duplicates by using a Set to ensure uniqueness
    }

    // Helper method to recursively collect tags
    private collectTags(tags: string[]) {
        tags.push(this.tag); // Add the current tag
        for (const child of this.children) {
            child.collectTags(tags); // Recursively collect from children
        }
    }
}

export default class Document implements IDocument, IDbModel {
  static table = "documents";

  id = "";
  title: string;
  content: string;
  entityIds: string[] = [];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IDocument>) {
    this.id = data.id || "";
    this.title = data.title || "";
    this.content = data.content || "";
    this.createdAt = data.createdAt || new Date();
    if (data.updatedAt !== undefined) {
      this.updatedAt = data.updatedAt;
    }
    this.entityIds = this.findEntities();
  }

  /**
   * Parses the raw content and finds tags - entity ids
   * @returns
   */
  findEntities(): string[] {
    const regex = /<([\w-\.]+)>/g;
    let match;

    const entities = [];

    while ((match = regex.exec(this.content)) !== null) {
      entities.push(match[1]);
    }

    const uEntities = [...new Set(entities)];

    return uEntities;
  }

  /**
   * Finds content inside anchor-tags specified by entity id(tag)
   * @param tag
   * @returns
   */
  findAnchors(tag: string): string[] {
    const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, "g");

    const result: string[] = [];

    let match;
    while ((match = regex.exec(this.content)) !== null) {
      // match[1] contains the text inside the tag
      result.push(match[1]);
    }

    return result;
  }

  buildTagTree(content: string): TreeNode[] {
    const tree: TreeNode[] = [];
    const regex = /<([\w\-.]+)>([\s\S]*?)<\/\1>/g; // Regex to find tags with content (without 's' flag)

    let match;
    while ((match = regex.exec(content)) !== null) {
        const [fullMatch, tag, innerContent] = match;
        
        // Create a TreeNode for this tag
        const node = new TreeNode(tag, innerContent.trim());

        // Recursively parse children in inner content
        node.children = this.buildTagTree(innerContent);
        
        tree.push(node);
    }

    return tree;
}

  /**
   * Stores the document in the db
   * @param db db connection
   * @returns Promise<boolean> to indicate result of the operation
   */
  async save(db: Connection | undefined): Promise<boolean> {
    this.createdAt = new Date();

    const result = await rethink
      .table(Document.table)
      .insert({ ...this, id: this.id || undefined })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    if (result.first_error && result.first_error.indexOf("Duplicate") !== -1) {
      throw new ModelNotValidError("id already exists");
    }

    return result.inserted === 1;
  }

  /**
   * Alters the document using provided object
   * @param db Connection
   * @returns updateData Partial<IDocument>
   */
  update(
    db: Connection | undefined,
    updateData: Partial<IDocument>
  ): Promise<WriteResult> {
    this.updatedAt = updateData.updatedAt = new Date();
    delete updateData.createdAt;
    return rethink
      .table(Document.table)
      .get(this.id)
      .update(updateData)
      .run(db);
  }

  /**
   * Deletes the document
   * @param db Connection
   * @returns boolean
   */
  async delete(db: Connection): Promise<WriteResult> {
    if (!this.id) {
      throw new InternalServerError(
        "delete called on document with undefined id"
      );
    }

    const result = await rethink
      .table(Document.table)
      .get(this.id)
      .delete()
      .run(db);

    return result;
  }

  /**
   * Predicate for testing if the document is valid
   * @returns boolean
   */
  isValid(): boolean {
    if (!this.content) {
      return false;
    }
    if (!this.title) {
      return false;
    }
    return true;
  }

  /**
   * Predicate for testing if the document can be viewed by provided user
   * @param user User
   * @returns boolean
   */
  canBeViewedByUser(user: User): boolean {
    return true;
  }

  /**
   * Predicate for testing if the document can be created by provided user
   * @param user User
   * @returns boolean
   */
  canBeCreatedByUser(user: User): boolean {
    return true;
  }

  /**
   * Predicate for testing if the document can be edited by provided user
   * @param user User
   * @returns boolean
   */
  canBeEditedByUser(user: User): boolean {
    return user.role !== UserEnums.Role.Viewer;
  }

  /**
   * Predicate for testing if the document can be deleted by provided user
   * @param user User
   * @returns boolean
   */
  canBeDeletedByUser(user: User): boolean {
    return true;
  }

  removeAnchors(entityIds: string[]) {
    for (const entityId of entityIds) {
      const tagRegex = new RegExp(`<\\/?${entityId}(>|$)`, "g");
      const updatedContent = this.content.replace(tagRegex, "");
      this.content = updatedContent;
      this.entityIds = this.entityIds.filter((id) => id !== entityId);
    }
  }

  /**
   * search for single document by ids
   * @param db Connection database connection
   * @param documentId string id
   * @returns Promise<Document> wanted document
   */
  static async getDocumentById(
    db: Connection,
    documentId: string
  ): Promise<Document | null> {
    const data = await rethink.table(Document.table).get(documentId).run(db);

    return data ? new Document(data) : null;
  }

  /**
   * search for multiple documents by ids
   * @param db Connection database connection
   * @param documentIds string[] list of ids
   * @returns Promise<Document[]> list of documents
   */
  static async findDocumentsByIds(
    db: Connection,
    documentIds: string[]
  ): Promise<Document[]> {
    const entries = await rethink
      .table(Document.table)
      .getAll(documentIds)
      .run(db);

    return entries && entries.length ? entries.map((d) => new Document(d)) : [];
  }

  /**
   *
   * @param db
   * @param entityId
   * @returns
   */
  static async findByEntityId(
    db: Connection,
    entityId: string
  ): Promise<IDocument[]> {
    const entries = await rethink
      .table(Document.table)
      .filter(function (row: RDatum) {
        return row("entityIds").contains(entityId);
      })
      .run(db);

    return entries && entries.length ? (entries as IDocument[]) : [];
  }

  /**
   * Retrieves all documents
   * @param db Connection database connection
   * @returns Promise<IDocument[]> list of documents
   */
  static async getAll(db: Connection): Promise<IDocument[]> {
    const entries = await rethink
      .table(Document.table)
      .orderBy(rethink.asc("createdAt"))
      .run(db);
    return entries && entries.length ? entries : [];
  }
}
