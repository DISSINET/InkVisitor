import { ISavedQuery, ISavedQueryData } from "@inkvisitor/shared/types";
import { IDbModel } from "@models/common";
import { Connection, RDatum, WriteResult, r as rethink } from "rethinkdb-ts";

export default class SavedQuery implements ISavedQuery, IDbModel {
  static table = "saved_queries";

  id: string;
  name: string;
  ownerId: string;
  shared: boolean;
  data: ISavedQueryData;
  createdAt: Date;
  updatedAt?: Date;

  constructor(data: Partial<ISavedQuery>) {
    this.id = data.id as string;
    this.name = data.name || "";
    this.ownerId = data.ownerId || "";
    this.shared = !!data.shared;
    this.data = data.data as ISavedQueryData;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt;
  }

  isValid(): boolean {
    return (
      !!this.name.trim() &&
      !!this.ownerId &&
      !!this.data &&
      typeof this.data.includeEquivalents === "boolean" &&
      typeof this.data.includeSubordinates === "boolean" &&
      (this.data.filters === undefined || Array.isArray(this.data.filters)) &&
      SavedQuery.isQueryNodeValid(this.data.query)
    );
  }

  /**
   * Recursively checks the stored query tree has the shape the client
   * expects when loading it (a malformed shared query would otherwise
   * crash the Explorer page for every user who clicks it).
   */
  static isQueryNodeValid(node: unknown): boolean {
    if (!node || typeof node !== "object") {
      return false;
    }
    const n = node as Record<string, unknown>;
    if (
      typeof n.type !== "string" ||
      typeof n.operator !== "string" ||
      !n.params ||
      typeof n.params !== "object" ||
      !Array.isArray(n.edges)
    ) {
      return false;
    }
    return n.edges.every((edge: unknown) => {
      if (!edge || typeof edge !== "object") {
        return false;
      }
      const e = edge as Record<string, unknown>;
      return (
        typeof e.type === "string" &&
        typeof e.logic === "string" &&
        SavedQuery.isQueryNodeValid(e.node)
      );
    });
  }

  async save(dbInstance: Connection | undefined): Promise<boolean> {
    const result = await rethink
      .table(SavedQuery.table)
      .insert({ ...this, id: this.id || undefined })
      .run(dbInstance);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1;
  }

  update(
    dbInstance: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    return rethink
      .table(SavedQuery.table)
      .get(this.id)
      .update({ ...updateData, updatedAt: new Date() })
      .run(dbInstance);
  }

  delete(dbInstance: Connection): Promise<WriteResult> {
    return rethink
      .table(SavedQuery.table)
      .get(this.id)
      .delete()
      .run(dbInstance);
  }

  static async findById(
    dbInstance: Connection | undefined,
    id: string
  ): Promise<SavedQuery | null> {
    const data = await rethink.table(SavedQuery.table).get(id).run(dbInstance);
    return data ? new SavedQuery(data as ISavedQuery) : null;
  }

  /**
   * Returns all queries the user may see: their own (private + shared)
   * plus everyone's shared ones. Newest first.
   */
  static async findVisibleForUser(
    dbInstance: Connection | undefined,
    userId: string
  ): Promise<ISavedQuery[]> {
    const data = await rethink
      .table(SavedQuery.table)
      .filter((row: RDatum) =>
        row("shared").eq(true).or(row("ownerId").eq(userId))
      )
      .orderBy(rethink.desc("createdAt"))
      .run(dbInstance);

    return data as ISavedQuery[];
  }
}
