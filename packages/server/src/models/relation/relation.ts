import { IDbModel, IModel } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IEntity, Relation as RelationTypes } from "@shared/types";
import { DbEnums, EntityEnums, RelationEnums, UserEnums } from "@shared/enums";
import { EnumValidators } from "@shared/enums";
import { InternalServerError, ModelNotValidError } from "@shared/types/errors";
import User from "@models/user/user";
import { IRequest } from "src/custom_typings/request";
import { nonenumerable } from "@common/decorators";
import Entity from "@models/entity/entity";

export interface IRelationModel extends RelationTypes.IRelation, IDbModel {
  beforeSave(request: IRequest): Promise<void>
  afterSave(request: IRequest): Promise<void>
}

export default class Relation implements IRelationModel {
  static table = "relations";

  id: string;
  type: RelationEnums.Type;
  entityIds: string[];

  @nonenumerable
  entities?: IEntity[]; // holds preloaded entities for checks

  constructor(data: Partial<RelationTypes.IRelation>) {
    this.id = data.id || "";
    this.type = data.type as RelationEnums.Type;
    this.entityIds = data.entityIds || [];
  }

  /**
   * Shorthand for testing if entity linked to this relation if of required class.
   * Throws an InternalServerError in case the entity is not preloaded - entities should be already loaded before calling this method
   * @param entityId 
   * @param acceptableClasses 
   */
  hasEntityCorrectClass(entityId: string, acceptableClasses: EntityEnums.Class[]): boolean {
    const loadedEntity = this.entities?.find(e => e.id === entityId);
    if (!loadedEntity) {
      throw new InternalServerError('', `cannot check entity's class - not preloaded`);
    }

    return acceptableClasses.indexOf(loadedEntity.class) !== -1;
  }

  /**
  * areEntitiesValid checks if entities have acceptable classes
  * @returns 
  */
  areEntitiesValid(): Error | null {
    for (const entityId of this.entityIds) {
      if (!this.hasEntityCorrectClass(entityId, Object.values(EntityEnums.Class))) {
        return new ModelNotValidError(`Entity '${entityId}' does not have valid class`);
      }
    }

    return null;
  }

  async afterSave(request: IRequest): Promise<void> {

  }

  /**
   * use this method for doing asynchronous operation/checks before save/create is called
   * @param request 
   */
  async beforeSave(request: IRequest): Promise<void> {
    if (!this.entities) {
      this.entities = await Entity.findEntitiesByIds(request.db.connection, this.entityIds)
    }

    const err = this.areEntitiesValid();
    if (err) {
      throw err;
    }
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
    // is must be string or undefined
    if (typeof this.id !== "string" && this.id !== undefined) {
      return false;
    }

    // default test for relation type
    if (!EnumValidators.IsValidRelationType(this.type)) {
      return false;
    }

    // entityIds must be [] with at least 2 strings
    if (this.entityIds === undefined ||
      this.entityIds.constructor.name !== "Array" ||
      this.entityIds.length < 2 ||
      !this.entityIds.reduce((acc, eId) => acc && typeof eId === 'string', true)
    ) {
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
