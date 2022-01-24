import { IDbModel, UnknownObject, fillFlatObject } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IAudit } from "@shared/types";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";

export default class Audit implements IAudit, IDbModel {
  static table = "audits";

  id: string = "";
  actantId: string = "";
  user: string = "";
  date: Date = new Date();
  changes: object = {};

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, { ...data });
    this.changes = data.changes as object;
  }

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

  update(
    db: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    throw new InternalServerError("Audit entry cannot be updated");
  }

  async delete(db: Connection | undefined): Promise<WriteResult> {
    throw new InternalServerError("Audit entry cannot be deleted");
  }

  isValid(): boolean {
    return true;
  }

  static async createNew(
    db: Connection | undefined,
    user: User,
    actantId: string,
    updateData: object
  ): Promise<WriteResult> {
    const entry = new Audit({
      actantId,
      user: user.id,
      changes: updateData,
    });
    return entry.save(db);
  }
}
