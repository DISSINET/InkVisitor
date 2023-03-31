import { determineOrder, IDbModel, IModel } from "@models/common";
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
  beforeSave(request: IRequest): Promise<void>;
  afterSave(request: IRequest): Promise<void>;
}

export default class Relation implements IRelationModel {
  static table = "relations";

  id: string;
  type: RelationEnums.Type;
  entityIds: string[];
  order?: number;

  @nonenumerable
  entities?: IEntity[]; // holds preloaded entities for validity checks

  constructor(data: Partial<RelationTypes.IRelation>) {
    this.id = data.id || "";
    this.type = data.type as RelationEnums.Type;
    this.entityIds = data.entityIds || [];
    this.order = data.order;
  }

  /**
   * Getter for preloaded entity - either returns the entity or fails with InternalServerError
   * @param entityId
   * @returns
   */
  getPreloadedEntity(entityId: string): IEntity {
    const loadedEntity = this.entities?.find((e) => e.id === entityId);
    if (!loadedEntity) {
      throw new InternalServerError(
        "",
        "cannot retrieve entity - not preloaded"
      );
    }

    return loadedEntity;
  }

  /**
   * Shorthand for testing if entity linked to this relation if of required class.
   * Throws an InternalServerError in case the entity is not preloaded - entities should be already loaded before calling this method
   * @param entityId
   * @param acceptableClasses
   */
  hasEntityCorrectClass(
    entityId: string,
    acceptableClass: EntityEnums.Class
  ): boolean {
    return acceptableClass === this.getPreloadedEntity(entityId).class;
  }

  /**
   * Tests if all entities have the same class, by utilizing hasEntityCorrectClass method.
   * Throws error if some entity is not preloaded.
   * @param entityIds
   * @returns
   */
  areEntitiesSameClass(): boolean {
    if (!this.entityIds.length) {
      return true;
    }

    const firstEntity = this.entities?.find((e) => e.id === this.entityIds[0]);

    for (const id of this.entityIds) {
      if (
        !this.hasEntityCorrectClass(
          id,
          firstEntity ? firstEntity.class : ("" as EntityEnums.Class)
        )
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * tests if entities data are acceptable, for now tests only if entities are not templates
   * @returns
   */
  validateEntitiesData(): Error | null {
    for (const i in this.entityIds) {
      const loadedEntity = this.getPreloadedEntity(this.entityIds[i]);
      if (loadedEntity.isTemplate) {
        return new ModelNotValidError(
          `Entity ${loadedEntity.id} must not be a template`
        );
      }
    }

    return null;
  }

  /**
   * validateEntities checks if entities can be used in the relation
   * @returns
   */
  validateEntities(): Error | null {
    const entityNotAllowedError = this.validateEntitiesData();
    if (entityNotAllowedError) {
      return entityNotAllowedError;
    }

    const rules = RelationTypes.RelationRules[this.type];
    if (!rules) {
      return new InternalServerError(
        `Missing rules for relation type '${this.type}'`
      );
    }

    // check if same-classes-only is required
    let patternFound =
      !rules.allowedSameEntityClassesOnly || this.areEntitiesSameClass();
    if (!patternFound) {
      return new ModelNotValidError("Entities must have the same class");
    }

    for (const pattern of rules?.allowedEntitiesPattern) {
      if (!rules.cloudType && pattern.length !== this.entityIds.length) {
        return new ModelNotValidError(
          `Pattern requires '${pattern.length}' entities`
        );
      }

      for (const i in this.entityIds) {
        // cloud type has always
        const wantedClass = rules.cloudType ? pattern[0] : pattern[i];

        patternFound = this.hasEntityCorrectClass(
          this.entityIds[i],
          wantedClass
        );
        if (!patternFound) {
          // pattern cannot be accepted any further - continue with another pattern
          break;
        }
      }

      if (patternFound) {
        // pattern acceptable and no more entities to check
        break;
      }
    }

    if (!patternFound) {
      return new ModelNotValidError("Not allowed entity-class pattern");
    }

    return null;
  }

  /**
   * Use this method for doing asynchronous operation/checks before the save operation
   * @param request
   */
  async beforeSave(request: IRequest): Promise<void> {
    if (!this.entities || this.entities.length !== this.entityIds.length) {
      this.entities = await Entity.findEntitiesByIds(
        request.db.connection,
        this.entityIds
      );

      if (this.entities.length !== this.entityIds.length) {
        throw new ModelNotValidError("At least one entity does not exist");
      }
    }

    const err = this.validateEntities();
    if (err) {
      throw err;
    }

    if (typeof this.order === "number") {
      const siblings = await this.getSiblings(request.db.connection);
      const mapped = siblings.reduce((acc, cur) => {
        if (cur.order !== undefined) {
          acc[cur.order] = true;
        }
        return acc;
      }, {} as Record<number, unknown>);
      this.order = determineOrder(this.order, mapped);
    }
  }

  /**
   * Use this method for doing asynchronous operation/checks after the save operation
   * @param request
   */
  async afterSave(request: IRequest): Promise<void> {}

  /**
   * returns list of relations with the same main entityId (minus this entity)
   * @param db database connection
   * @returns  list of relations
   */
  async getSiblings(db: Connection): Promise<RelationTypes.IRelation[]> {
    const childs = await Relation.getForEntity(
      db,
      this.entityIds[0],
      this.type
    );
    return childs.filter((ch) => ch.id !== this.id);
  }

  /**
   * Stores the relation in the db
   * @param db db connection
   * @returns Promise<boolean> to indicate result of the operation
   */
  async save(db: Connection | undefined): Promise<boolean> {
    const result = await rethink
      .table(Relation.table)
      .insert({ ...this, id: this.id || undefined })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1;
  }

  /**
   * Updates data for relation entry identified by model's id
   * @param db
   * @param updateData
   * @returns
   */
  async update(
    db: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    return rethink
      .table(Relation.table)
      .get(this.id)
      .update(updateData)
      .run(db);
  }

  /**
   * Deletes the relation entry identified by model's id.
   * Throws an error if the id is empty.
   * @param db
   * @param updateData
   * @returns
   */
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
    const rules = RelationTypes.RelationRules[this.type];

    if (!rules) {
      throw new InternalServerError(
        `Missing rules for relation type '${this.type}'`
      );
    }

    // id must be string or undefined
    if (typeof this.id !== "string" && this.id !== undefined) {
      return false;
    }

    // default test for relation type
    if (!EnumValidators.IsValidRelationType(this.type)) {
      return false;
    }

    // entityIds must be [] with at least 2 strings
    if (
      this.entityIds === undefined ||
      this.entityIds.constructor.name !== "Array" ||
      this.entityIds.length < 2 ||
      !this.entityIds.reduce((acc, eId) => acc && typeof eId === "string", true)
    ) {
      return false;
    }

    if (rules.order && typeof this.order !== "number") {
      throw new ModelNotValidError(
        `Order must be a number for relation type '${this.type}'`
      );
    }

    return true;
  }

  /**
   * Predicate for testing if the current user can view the relation entry
   * @param user
   * @returns
   */
  canBeViewedByUser(user: User): boolean {
    return true;
  }

  /**
   * Predicate for testing if the current user can create the relation
   * @param user
   * @returns
   */
  canBeCreatedByUser(user: User): boolean {
    return user.role !== UserEnums.Role.Viewer;
  }

  /**
   * Predicate for testing if the current user can edit the relation entry
   * @param user
   * @returns
   */
  canBeEditedByUser(user: User): boolean {
    return user.role !== UserEnums.Role.Viewer;
  }

  /**
   * Predicate for testing if the current user can delete the relation entry
   * @param user
   * @returns
   */
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
  static async getForEntity<T extends RelationTypes.IRelation>(
    db: Connection,
    entityId: string,
    relType?: RelationEnums.Type,
    position?: number
  ): Promise<T[]> {
    const items: T[] = await rethink
      .table(Relation.table)
      .getAll(entityId, { index: DbEnums.Indexes.RelationsEntityIds })
      .filter(relType ? { type: relType } : {})
      .run(db);

    if (position !== undefined) {
      return items.filter((d) => d.entityIds[position] === entityId);
    }
    return items;
  }

  /**
   * Retrieves all relation entries filtered by basic parameters like type
   * @param db
   * @param relType
   * @returns array of relation interfaces
   */
  static async getAll(
    req: IRequest,
    relType?: RelationEnums.Type
  ): Promise<RelationTypes.IRelation[]> {
    const items: RelationTypes.IRelation[] = await rethink
      .table(Relation.table)
      .filter(relType ? { type: relType } : {})
      .run(req.db.connection);

    return items;
  }

  /**
   * Removes multiple relation entries
   * @param request
   * @param ids
   * @returns
   */
  static async deleteMany(
    request: IRequest,
    ids: string[]
  ): Promise<WriteResult> {
    return rethink
      .table(Relation.table)
      .getAll.apply(undefined, ids)
      .delete()
      .run(request.db.connection);
  }
}
