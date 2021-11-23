import { IDbModel, UnknownObject, fillFlatObject, fillArray } from "./common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IStatement, IActant, IAudit } from "@shared/types";
import {
  ActantStatus,
  ActantType,
  Language,
  UserRole,
  UserRoleMode,
} from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "./user";
import emitter from "./events/emitter";
import { EventTypes } from "./events/types";
import Actant from "./actant";

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

  static async getFirstForActant(
    db: Connection | undefined,
    actantId: string
  ): Promise<Audit | null> {
    const result = await rethink
      .table(Audit.table)
      .filter({ actantId })
      .run(db);

    if (!result || !result.length) {
      return null;
    }

    return new Audit(result[0]);
  }

  static async getLastNForActant(
    db: Connection | undefined,
    actantId: string,
    n: number = 5
  ): Promise<Audit[]> {
    const result = await rethink
      .table(Audit.table)
      .filter({ actantId })
      .orderBy(rethink.desc("date"))
      .limit(n)
      .run(db);

    if (!result || !result.length) {
      return [];
    }

    return result.map((r) => new Audit(r));
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
