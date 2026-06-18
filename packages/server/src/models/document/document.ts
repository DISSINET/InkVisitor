import { IDbModel } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IDocument, IDocumentMeta } from "@inkvisitor/shared/types";
import { DbEnums, EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { InternalServerError, ModelNotValidError } from "@inkvisitor/shared/types/errors";
import User from "@models/user/user";
import { AnchorsNode } from "./anchors";
import Entity from "@models/entity/entity";
import { createOpeningTagRegex, createSpecificOpeningTagRegex, closingTagRegex } from "@common/regex";

export default class Document implements IDocument, IDbModel {
  static table = "documents";

  id: string;
  title: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;

  // following fields are populated in preprocess method (before save)
  anchors: AnchorsNode[];
  entityIds: Record<EntityEnums.Class, string[]>;

  constructor(data: Partial<IDocument>) {
    this.id = data.id || "";
    this.title = data.title || "";
    this.content = data.content || "";
    this.entityIds = data.entityIds || {} as Record<EntityEnums.Class, string[]>;
    this.anchors = data.anchors?.map((anchor) => new AnchorsNode(anchor.anchor, anchor.content, anchor.children, anchor.class)) || [];

    this.createdAt = data.createdAt || new Date();
    if (data.updatedAt !== undefined) {
      this.updatedAt = data.updatedAt;
    }
  }

  /**
   * Preprocesses the document to find entity ids and build anchors tree.
   * Issues one DB round-trip to resolve referenced entities. Called by
   * every write path so the derived fields are persisted alongside content.
   */
  async preprocess(conn: Connection): Promise<void> {
    const ids = this.gatherEntityIds();
    this.entityIds = await this.findReferencedEntityIds(conn, ids);
    this.anchors = AnchorsNode.buildAnchorsTree(this.content, this.entityIds);
  }

  static emptyEntityIdsRecord(): Record<EntityEnums.Class, string[]> {
    return {
      [EntityEnums.Class.Action]: [],
      [EntityEnums.Class.Resource]: [],
      [EntityEnums.Class.Concept]: [],
      [EntityEnums.Class.Person]: [],
      [EntityEnums.Class.Location]: [],
      [EntityEnums.Class.Event]: [],
      [EntityEnums.Class.Object]: [],
      [EntityEnums.Class.Territory]: [],
      [EntityEnums.Class.Statement]: [],
      [EntityEnums.Class.Value]: [],
      [EntityEnums.Class.Being]: [],
      [EntityEnums.Class.Group]: [],
    };
  }

  static bucketByClass(
    ids: string[],
    classById: Map<string, EntityEnums.Class>
  ): Record<EntityEnums.Class, string[]> {
    const out = Document.emptyEntityIdsRecord();
    for (const id of ids) {
      const cls = classById.get(id);
      if (cls) out[cls].push(id);
    }
    return out;
  }

  /**
   * Coerces a possibly-legacy `entityIds` value into the canonical
   * Record<Class, string[]> shape that consumers (client annotator, badge
   * counts, anchor-count sort) assume - notably guaranteeing a `T` key that
   * is always an array.
   *
   * LEGACY ONLY: rows re-saved since preprocess-on-write (#2643) already
   * store the canonical shape, so this is a no-op for them. Rows that
   * predate it may hold a flat string[] or an object missing some class
   * keys; without this the client reads `entityIds.T` as undefined and
   * throws on `.includes`. A flat array can't be re-bucketed without each
   * id's class, so it degrades to an empty (but valid) record - re-saving
   * such a document repopulates it.
   */
  static normalizeEntityIds(
    raw: unknown
  ): Record<EntityEnums.Class, string[]> {
    const out = Document.emptyEntityIdsRecord();
    if (!raw || Array.isArray(raw) || typeof raw !== "object") {
      return out;
    }
    for (const cls of Object.keys(out) as EntityEnums.Class[]) {
      const ids = (raw as Record<string, unknown>)[cls];
      if (Array.isArray(ids)) {
        out[cls] = ids.filter((id): id is string => typeof id === "string");
      }
    }
    return out;
  }

  /**
   * Parses the raw content and gathers tags - entity ids
   * @returns unique list of entity IDs
   */
  gatherEntityIds(): string[] {
    // Match opening tags that contain entity IDs using standardized regex
    const regex = createOpeningTagRegex();
    const entities = new Set<string>();
    let match;

    while ((match = regex.exec(this.content)) !== null) {
      // Extract only the tag name (first word before any attributes or spaces)
      const tagName = match[1].split(/\s+/)[0];
      entities.add(tagName);
    }

    return Array.from(entities);
  }

  /**
   * Finds referenced entity ids
   * @param conn Connection
   * @param ids string[]
   * @returns Promise<Record<EntityEnums.Class, string[]>>
   */
  async findReferencedEntityIds(
    conn: Connection,
    ids: string[]
  ): Promise<Record<EntityEnums.Class, string[]>> {
    const entities = await Entity.findEntitiesByIds(conn, ids);
    const classById = new Map<string, EntityEnums.Class>();
    for (const e of entities) {
      if (e.class) classById.set(e.id, e.class);
    }
    return Document.bucketByClass(ids, classById);
  }

  /**
   * Finds content inside one anchor-tag specified by entity id(tag) and index position in document
   * @param tag
   * @returns
   */
  findAnchorWithIndex(tag: string, index: number): AnchorsNode | null {
    let foundIndex = 0;
    // Helper function to traverse the tree and find the nth occurrence of the tag
    const traverse = (nodes: AnchorsNode[]): AnchorsNode | null => {
      for (const node of nodes) {
        if (node.anchor === tag) {
          if (foundIndex === index) {
            return node;
          }
          foundIndex++;
        }
        const result = traverse(node.children);
        if (result !== null) {
          return result;
        }
      }
      return null;
    };

    const result = traverse(this.anchors);
    return result;
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
      // Remove opening tags with attributes
      const openingTagRegex = createSpecificOpeningTagRegex(entityId);
      this.content = this.content.replace(openingTagRegex, "");
      
      // Remove closing tags
      const closingTagRegexInstance = new RegExp(`</${entityId}>`, "g");
      this.content = this.content.replace(closingTagRegexInstance, "");

      // Search and remove the id from all class arrays
      Object.keys(this.entityIds).forEach((classKey) => {
        this.entityIds[classKey as EntityEnums.Class] = this.entityIds[classKey as EntityEnums.Class].filter(
          (id) => id !== entityId
        );
      });
    }
  }

  removeAnchor(entityId: string, index: number) {
    const openingTagRegex = createSpecificOpeningTagRegex(entityId);
    const closingTagRegexInstance = new RegExp(`</${entityId}>`, "g");
    
    let match;
    let count = 0;
    const positions: { start: number; end: number; openingTagLength: number }[] = [];

    // Find all opening tags in the content
    while ((match = openingTagRegex.exec(this.content)) !== null) {
      positions.push({ 
        start: match.index, 
        end: -1, 
        openingTagLength: match[0].length 
      });
    }

    // Find corresponding closing tags
    while ((match = closingTagRegexInstance.exec(this.content)) !== null) {
      // Find the matching opening tag (the one without an end position)
      for (let i = positions.length - 1; i >= 0; i--) {
        if (positions[i].end === -1) {
          positions[i].end = match.index + match[0].length;
          count++;
          break;
        }
      }
    }

    // Out of bounds
    if (index < 0 || index >= positions.length) {
      return;
    }

    const targetTag = positions[index];
    if (targetTag.start !== -1 && targetTag.end !== -1) {
      this.content =
        this.content.slice(0, targetTag.start) +
        this.content.slice(
          targetTag.start + targetTag.openingTagLength,
          targetTag.end - `</${entityId}>`.length
        ) +
        this.content.slice(targetTag.end);
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
  ): Promise<IDocumentMeta[]> {
    // No caller needs the (potentially large) content blob - consumers want
    // the document meta + anchors or just the ids - so content is dropped
    // from the read (return type IDocumentMeta enforces that).
    //
    // The documents.entityIds multi-index flattens both the legacy string[]
    // and the canonical Record<Class, string[]> shapes, so getAll touches
    // only the matching documents instead of scanning the whole table. The
    // index is a required boot dependency (see assertRequiredIndexes).
    const entries = await rethink
      .table(Document.table)
      .getAll(entityId, { index: DbEnums.Indexes.DocumentEntityIds })
      .without("content")
      // getAll on a multi-index yields one row per matching index key, so a
      // document that lists the same id more than once (a legacy flat array
      // with duplicates, or an id bucketed under multiple classes) would come
      // back multiple times. distinct() restores the single-occurrence
      // semantics of the previous contains() filter (same approach as
      // Relation.findForEntities).
      .distinct()
      .run(db);

    return entries && entries.length ? (entries as IDocumentMeta[]) : [];
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
