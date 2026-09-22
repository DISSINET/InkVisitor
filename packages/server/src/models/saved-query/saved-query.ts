import {
  MAX_SAVED_QUERY_DEPTH,
  MAX_SAVED_QUERY_NODES,
} from "@inkvisitor/shared/constants";
import { ISavedQuery, ISavedQueryData } from "@inkvisitor/shared/types";
import { IDbModel } from "@models/common";
import { Conn, WriteResult, storage } from "@service/storage";

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
    this.name = (data.name || "").trim();
    this.ownerId = data.ownerId || "";
    this.shared = !!data.shared;
    this.data = data.data as ISavedQueryData;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt;
  }

  isValid(): boolean {
    return (
      !!this.name &&
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
   *
   * A tree deeper than MAX_SAVED_QUERY_DEPTH or wider than
   * MAX_SAVED_QUERY_NODES is treated as malformed: the walk runs on untrusted
   * JSON before anything about it is known, so its own recursion has to be the
   * thing that is bounded.
   */
  static isQueryNodeValid(node: unknown): boolean {
    return SavedQuery.walkQueryNode(node, 1, { visited: 0 });
  }

  private static walkQueryNode(
    node: unknown,
    depth: number,
    budget: { visited: number }
  ): boolean {
    if (depth > MAX_SAVED_QUERY_DEPTH) {
      return false;
    }
    budget.visited += 1;
    if (budget.visited > MAX_SAVED_QUERY_NODES) {
      return false;
    }
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
        SavedQuery.walkQueryNode(e.node, depth + 1, budget)
      );
    });
  }

  async save(dbInstance: Conn | undefined): Promise<boolean> {
    const result = await storage.savedQueries.insert(dbInstance as Conn, {
      ...this,
      id: this.id || undefined,
    });

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1;
  }

  update(
    dbInstance: Conn | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    return storage.savedQueries.update(dbInstance as Conn, this.id, {
      ...updateData,
      updatedAt: new Date(),
    });
  }

  delete(dbInstance: Conn): Promise<WriteResult> {
    return storage.savedQueries.delete(dbInstance, this.id);
  }

  static async findById(
    dbInstance: Conn | undefined,
    id: string
  ): Promise<SavedQuery | null> {
    const data = await storage.savedQueries.get(dbInstance as Conn, id);
    return data ? new SavedQuery(data) : null;
  }

  /**
   * Names are unique within a folder as the panel lists them: every shared
   * query shares one namespace, each user's private queries another. Names
   * that read the same collide, so the comparison ignores case (stored names
   * are already trimmed by the constructor).
   *
   */
  static async isNameTaken(
    dbInstance: Conn | undefined,
    name: string,
    shared: boolean,
    ownerId: string,
    exceptId?: string
  ): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const ids = await storage.savedQueries.idsWithName(
      dbInstance as Conn,
      normalized,
      shared,
      ownerId
    );

    return ids.some((id) => id !== exceptId);
  }

  /**
   * Returns all queries the user may see: their own (private + shared)
   * plus everyone's shared ones. Newest first.
   */
  static async findVisibleForUser(
    dbInstance: Conn | undefined,
    userId: string
  ): Promise<ISavedQuery[]> {
    return storage.savedQueries.visibleFor(dbInstance as Conn, userId);
  }
}
