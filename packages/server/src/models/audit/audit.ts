import { IDbModel, fillFlatObject } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IAudit } from "@shared/types";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";

export default class Audit implements IAudit, IDbModel {
  static table = "audits";

  id: string = "";
  entityId: string = "";
  user: string = "";
  date: Date = new Date();
  changes: object;

  constructor(data: Partial<Audit>) {
    fillFlatObject(this, { ...data });
    this.changes = data.changes as object;
  }

  /**
   * Inserts the Audit entry to the db.
   * Stores created id in the structure afterwards.
   * @param db rethinkdb Connection
   * @returns Promise<WriteResult>
   */
  async save(db: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(Audit.table)
      .insert({ ...this, id: this.id || undefined })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result;
  }

  /**
   * Throws error immediately - Audit entry is immutable.
   * Provides implementation for satisfying IDbModel interface.
   * @param db rethinkdb Connection
   * @param updateData Promise<WriteResult>
   */
  update(
    db: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    throw new InternalServerError("Audit entry cannot be updated");
  }

  /**
   * Throws error immediately - Audit entry is immutable.
   * Provides implementation for satisfying IDbModel interface.
   * @param db rethinkdb Connection
   * @param updateData Promise<WriteResult>
   */
  async delete(db: Connection | undefined): Promise<WriteResult> {
    throw new InternalServerError("Audit entry cannot be deleted");
  }

  /**
   * Predicate for testing if the Audit entry is valid
   * @returns boolean
   */
  isValid(): boolean {
    return true;
  }

  /**
   * Combines Audit constructor and save method to immediately create & persist in the db
   * @param db rethinkdb Connection
   * @param user User model - creator for the entry
   * @param entityId
   * @param updateData blob containing snapshot of entity data
   * @returns Promise<WriteResult>
   */
  static async createNew(
    db: Connection | undefined,
    user: User,
    entityId: string,
    updateData: object
  ): Promise<WriteResult> {
    const entry = new Audit({
      entityId,
      user: user.id,
      changes: updateData,
    });
    return entry.save(db);
  }
}
