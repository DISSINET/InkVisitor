import { IDbModel, UnknownObject, fillFlatObject } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IRelation } from "@shared/types";
import { isValidRelationType, RelationType, UserRole } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";
import { IRequest } from "src/custom.request";

export default class Relation implements IRelation, IDbModel {
  static table = "relations";

  id: string = "";
  type: RelationType = RelationType.Unknown;
  entityIds: string[] = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, { ...data, data: undefined });
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(Relation.table)
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
    return rethink
      .table(Relation.table)
      .get(this.id)
      .update(updateData)
      .run(db);
  }

  async delete(db: Connection | undefined): Promise<WriteResult> {
    if (!this.id) {
      throw new InternalServerError(
        "delete called on relation with undefined id"
      );
    }

    const result = await rethink
      .table(Relation.table)
      .get(this.id)
      .delete()
      .run(db);

    return result;
  }

  isValid(): boolean {
    return isValidRelationType(this.type);
  }

  canBeViewedByUser(user: User): boolean {
    return true;
  }

  canBeCreatedByUser(user: User): boolean {
    return user.role !== UserRole.Viewer;
  }

  canBeEditedByUser(user: User): boolean {
    return user.role !== UserRole.Viewer;
  }

  canBeDeletedByUser(user: User): boolean {
    return user.role !== UserRole.Viewer;
  }

  static async getById(req: IRequest, id: string): Promise<Relation | null> {
    const data = await rethink
      .table(Relation.table)
      .get(id)
      .run(req.db.connection);

    return data ? new Relation(data) : null;
  }
}
