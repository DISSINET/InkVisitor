import { IDbModel, UnknownObject, fillFlatObject } from "@models/common";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { Relation as RelationTypes } from "@shared/types";
import { DbEnums, RelationEnums, UserEnums } from "@shared/enums";
import { EnumValidators } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";
import { IRequest } from "src/custom.request";

export default class Relation implements RelationTypes.IModel, IDbModel {
  static table = "relations";

  id: string;
  type: RelationEnums.Type;
  entityIds: string[];

  constructor(data: UnknownObject) {
    if (!data) {
      data = {};
    }

    this.id = data.id
    this.type = data.type;
    this.entityIds = data.entityIds;
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

  /**
   * Test validity of the model
   * @returns 
   */
  isValid(): boolean {
    if (typeof this.id !== "string" && this.id !== undefined) {
      return false;
    }

    if (!EnumValidators.IsValidRelationType(this.type)) {
      return false;
    }

    if (this.entityIds === undefined) {
      return false;
    }

    if (this.entityIds.constructor.name !== "Array" || !this.entityIds.length || !this.entityIds.reduce((acc, cur) => acc && typeof cur === 'string', true)) {
      return false;
    }

    return true;
  }

  canBeViewedByUser(user: User): boolean {
    return true;
  }

  canBeCreatedByUser(user: User): boolean {
    return user.role !== UserEnums.Role.Viewer;
  }

  canBeEditedByUser(user: User): boolean {
    return user.role !== UserEnums.Role.Viewer;
  }

  canBeDeletedByUser(user: User): boolean {
    return user.role !== UserEnums.Role.Viewer;
  }

  /**
   * Searched for relation by id
   * @param req 
   * @param id 
   * @returns relation model or null if not found
   */
  static async getById(req: IRequest, id: string): Promise<Relation | null> {
    const data = await rethink
      .table(Relation.table)
      .get(id)
      .run(req.db.connection);

    return data ? new Relation(data) : null;
  }

  /**
   * Searches for relation assigned for entityId, filtered by optional relation type
   * @param req 
   * @param entityId 
   * @param relType 
   * @returns array of relation models
   */
  static async getForEntity(req: IRequest, entityId: string, relType?: RelationEnums.Type): Promise<Relation[]> {
    const data = await rethink
      .table(Relation.table)
      .getAll(entityId, { index: DbEnums.Indexes.RelationsEntityIds })
      .filter(relType ? { type: relType } : {})
      .run(req.db.connection);

    return data ? data.map(d => new Relation(d)) : [];
  }
}
