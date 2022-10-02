import { IDbModel, IModel } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { Relation as RelationTypes } from "@shared/types";
import { DbEnums, RelationEnums, UserEnums } from "@shared/enums";
import { EnumValidators } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";
import { IRequest } from "src/custom_typings/request";

export interface IRelationModel extends RelationTypes.IRelation, IDbModel {
  beforeSave(request: IRequest): Promise<void>
  afterSave(request: IRequest): Promise<void>
}

export default class Relation implements IRelationModel {
  static table = "relations";

  id: string;
  type: RelationEnums.Type;
  entityIds: string[];

  constructor(data: Partial<RelationTypes.IRelation>) {
    this.id = data.id || "";
    this.type = data.type as RelationEnums.Type;
    this.entityIds = data.entityIds || [];
  }

  async afterSave(request: IRequest): Promise<void> {

  }

  async beforeSave(request: IRequest): Promise<void> {

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

    if (this.entityIds.constructor.name !== "Array" || this.entityIds.length < 2 || !this.entityIds.reduce((acc, cur) => acc && typeof cur === 'string', true)) {
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
   * @param db 
   * @param entityId 
   * @param relType 
   * @param position - position in entityIds
   * @returns array of relation interfaces
   */
  static async getForEntity<T extends RelationTypes.IRelation>(db: Connection, entityId: string, relType?: RelationEnums.Type, position?: number): Promise<T[]> {
    const items: T[] = await rethink
      .table(Relation.table)
      .getAll(entityId, { index: DbEnums.Indexes.RelationsEntityIds })
      .filter(relType ? { type: relType } : {})
      .run(db)

    if (position !== undefined) {
      return items.filter(d => d.entityIds[position] === entityId)
    }
    return items;
  }

  /**
   * Removes multiple relation entries
   * @param request 
   * @param ids 
   * @returns 
   */
  static async deleteMany(request: IRequest, ids: string[]): Promise<WriteResult> {
    return rethink
      .table(Relation.table)
      .getAll.apply(undefined, ids)
      .delete()
      .run(request.db.connection);
  }
}