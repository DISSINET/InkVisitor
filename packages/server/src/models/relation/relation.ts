import { determineOrder, IDbModel } from "@models/common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import {
  IEntity,
  IStatement,
  Relation as RelationTypes,
  AuditScope,
} from "@inkvisitor/shared/types";
import { DbEnums, EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { EnumValidators } from "@inkvisitor/shared/enums";
import {
  InternalServerError,
  ModelNotValidError,
  RelationAsymetricalPathExist,
  RelationPathExist,
} from "@inkvisitor/shared/types/errors";
import User from "@models/user/user";
import { IRequest } from "../../custom_typings/request";
import { nonenumerable } from "@common/decorators";
import Entity from "@models/entity/entity";
import Audit from "@models/audit/audit";
import { EventType } from "@inkvisitor/shared/types/stats";
import Path from "./path";
import { findEntityById } from "@service/shorthands";

/**
 * Data beforeSave needs about a relation type as a whole: every relation of the
 * type, for the duplicate check, and the path graph built from them, for the
 * asymmetrical cycle check.
 *
 * Collecting it means a full table scan (Relation.getByType is an unindexed
 * filter), so a caller saving many relations of one type builds the context
 * once and hands it to each beforeSave. The context is mutable and must be kept
 * current with registerSavedRelation as relations are saved - the checks are
 * only as accurate as its contents.
 */
export interface RelationSaveContext {
  type: RelationEnums.Type;
  relationsOfType: IRelationModel[];
  /** Only built for asymmetrical types - the others never consult a path. */
  path: Path | null;
}

export interface IRelationModel extends RelationTypes.IRelation, IDbModel {
  beforeSave(request: IRequest, context?: RelationSaveContext): Promise<void>;
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

  @nonenumerable
  // transient marker set by save()/update() so afterSave() knows which audit
  // event to emit; non-enumerable so it is never persisted into the row
  _auditEventType?: EventType;

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

    let patternFound = false;

    if (rules?.disabledEntities) {
      for (const i in this.entityIds) {
        for (const disallowedClass of rules.disabledEntities) {
          if (this.hasEntityCorrectClass(this.entityIds[i], disallowedClass)) {
            return new ModelNotValidError("Not allowed entity-class pattern");
          }
        }
      }
    }

    if (rules?.allowedEntitiesPattern.length === 0) {
      return null;
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
  async beforeSave(
    request: IRequest,
    context?: RelationSaveContext
  ): Promise<void> {
    // a context is only usable for the type it was built for
    const sharedContext = context?.type === this.type ? context : undefined;

    // check for already existing relations with same ids
    const relationByType =
      sharedContext?.relationsOfType ??
      (await Relation.getByType(request.db.connection, this.type));
    relationByType.filter(rel => rel.id !== this.id).forEach((rel) => {
      if (this.type === RelationEnums.Type.Synonym) {
        // For SYN check if both arrays have the same length and contain the same elements
        if (
          this.entityIds.length === rel.entityIds.length &&
          this.entityIds.every((id) => rel.entityIds.includes(id))
        ) {
          throw new RelationPathExist();
        }
      } else {
        // For all other relation types, check the first two entityIds
        if (
          rel.entityIds[0] === this.entityIds[0] &&
          rel.entityIds[1] === this.entityIds[1]
        ) {
          throw new RelationPathExist();
        }
      }
    });

    if (RelationTypes.RelationRules[this.type]?.asymmetrical) {
      let pathHelper = sharedContext?.path;
      if (!pathHelper) {
        pathHelper = new Path(this.type);
        await pathHelper.build(
          await Relation.getByType(request.db.connection, this.type)
        );
      }
      if (pathHelper.pathExists(this.entityIds[1], this.entityIds[0])) {
        // default message for asymetrical path err
        let message = RelationAsymetricalPathExist.message;

        // custom message if superclass
        if (this.type === RelationEnums.Type.Superclass) {
          const entity = await findEntityById(
            request.db.connection,
            this.entityIds[1]
          );
          message = `'${entity.labels[0]}', that you attempted to use as superclass, is set as a subclass. Relation not created.`;
        }

        throw new RelationAsymetricalPathExist(message);
      }
    }

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
   * Use this method for doing asynchronous operation/checks after the save operation.
   * Emits the relation audit (create or edit) marked by save()/update().
   * @param request
   */
  async afterSave(request: IRequest): Promise<void> {
    if (this._auditEventType && this.id) {
      await Audit.createNew(
        request,
        AuditScope.Relation,
        this.id,
        this.auditSnapshot(),
        this._auditEventType
      );
      this._auditEventType = undefined;
    }
  }

  /**
   * Emits the relation deletion audit. Called after the relation is removed -
   * from the delete route and from deleteMany (Synonym cloud-merge).
   * @param request
   */
  async afterDelete(request: IRequest): Promise<void> {
    if (this.id) {
      await Audit.createNew(
        request,
        AuditScope.Relation,
        this.id,
        this.auditSnapshot(),
        EventType.RELATION_DELETE
      );
    }
  }

  /**
   * Snapshot of the relation data stored in the audit `changes` blob.
   * @returns plain object snapshot
   */
  auditSnapshot(): object {
    return {
      id: this.id,
      type: this.type,
      entityIds: this.entityIds,
      order: this.order,
    };
  }

  /**
   * returns list of relations with the same main entityId (minus this entity)
   * @param db database connection
   * @returns  list of relations
   */
  async getSiblings(db: Connection): Promise<RelationTypes.IRelation[]> {
    const childs = await Relation.findForEntities(
      db,
      [this.entityIds[0]],
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
    // mark for the create audit emitted in afterSave (excluded from the insert
    // below since _auditEventType is non-enumerable)
    this._auditEventType = EventType.RELATION_CREATE;

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
    // mark for the edit audit emitted in afterSave
    this._auditEventType = EventType.RELATION_EDIT;

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
  async delete(db: Connection): Promise<WriteResult> {
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
   * Predicate shared by the create/edit/delete checks. A relation attached to a
   * Statement shows up on that Statement, so writing it is a write to the
   * Statement and answers to the right of the Territory holding it. Entities of
   * other classes are not tied to a Territory and carry no such restriction.
   *
   * The Territory right can only be read from a loaded entity, so the caller has
   * to preload `entities` before asking; an unloaded relation is refused.
   * @param user
   * @returns
   */
  private isWritableByUser(user: User): boolean {
    if (user.role === UserEnums.Role.Viewer) {
      return false;
    }

    if (!this.entities || this.entities.length !== this.entityIds.length) {
      return false;
    }

    // statement.ts pulls in treeCache -> territory -> entity, and entity.ts
    // reaches this module back through shorthands; loading the class here rather
    // than at the top keeps Territory from extending an undefined Entity
    const {
      default: Statement,
    } = require("@models/statement/statement") as typeof import("@models/statement/statement");

    return this.entities.every((entity) => {
      if (entity.class !== EntityEnums.Class.Statement) {
        return true;
      }

      return new Statement(entity as IStatement).canBeEditedByUser(user);
    });
  }

  /**
   * Predicate for testing if the current user can create the relation
   * @param user
   * @returns
   */
  canBeCreatedByUser(user: User): boolean {
    return this.isWritableByUser(user);
  }

  /**
   * Predicate for testing if the current user can edit the relation entry
   * @param user
   * @returns
   */
  canBeEditedByUser(user: User): boolean {
    return this.isWritableByUser(user);
  }

  /**
   * Predicate for testing if the current user can delete the relation entry
   * @param user
   * @returns
   */
  canBeDeletedByUser(user: User): boolean {
    return this.isWritableByUser(user);
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

  static async getByType<T extends RelationTypes.IRelation>(
    db: Connection,
    relType: RelationEnums.Type
  ): Promise<T[]> {
    const items: T[] = await rethink
      .table(Relation.table)
      .filter({ type: relType })
      .run(db);

    return items;
  }

  /**
   * Loads the per-type data beforeSave needs, once, for a caller that is about
   * to create many relations of the same type. See RelationSaveContext.
   */
  static async buildSaveContext(
    db: Connection,
    relType: RelationEnums.Type
  ): Promise<RelationSaveContext> {
    const relationsOfType = await Relation.getByType<IRelationModel>(db, relType);

    let path: Path | null = null;
    if (RelationTypes.RelationRules[relType]?.asymmetrical) {
      path = new Path(relType);
      await path.build(relationsOfType);
    }

    return { type: relType, relationsOfType, path };
  }

  /**
   * Folds a just-saved relation into a shared context, so the duplicate and
   * cycle checks of later saves account for it.
   */
  static registerSavedRelation(
    context: RelationSaveContext,
    relation: IRelationModel
  ): void {
    if (context.type !== relation.type) {
      return;
    }
    context.relationsOfType.push(relation);
    context.path?.addEntry(relation);
  }

  /**
   * searches for relations with specific entity ids and returns both relation ids and connected entity ids
   * @param db Connection
   * @param entityIds string[]
   * @param relType RelationEnums.Type?
   * @returns promise with both entity/relation ids
   */
  static async getLinkedForEntities(
    db: Connection,
    entityIds: string[],
    relType?: RelationEnums.Type
  ): Promise<[string[], string[]]> {
    const linkedRelations = await Relation.findForEntities(
      db,
      entityIds,
      relType
    );
    let linkedEntitiyIds: string[], linkedRelationIds: string[];

    if (linkedRelations && linkedRelations.length) {
      linkedEntitiyIds = Array.from(
        new Set(
          linkedRelations.reduce<string[]>((acc, r) => {
            acc = acc.concat(r.entityIds);
            return acc;
          }, [])
        )
      ).filter((id) => entityIds.indexOf(id) === -1);
      linkedRelationIds = Array.from(new Set(linkedRelations.map((r) => r.id)));
    } else {
      linkedEntitiyIds = [];
      linkedRelationIds = [];
    }

    return [linkedEntitiyIds, linkedRelationIds];
  }

  /**
   * Searches for relations assigned for multiple entity ids, filtered by optional relation type
   * @param db
   * @param entityId array of entity ids
   * @param relType
   * @param position - position in entityIds
   * @returns array of relation interfaces
   */
  static async findForEntities<T extends RelationTypes.IRelation>(
    db: Connection,
    entityIds: string[],
    relType?: RelationEnums.Type,
    position?: number
  ): Promise<T[]> {
    const items: T[] = await rethink
      .table(Relation.table)
      .getAll.call(undefined, ...entityIds, {
        index: DbEnums.Indexes.RelationsEntityIds,
      })
      .filter(relType ? { type: relType } : {})
      .distinct()
      .run(db);

    if (position !== undefined) {
      return items.filter(
        (d) => entityIds.indexOf(d.entityIds[position]) !== -1
      );
    }
    return items;
  }

  /**
   * Searches for relations linked to a single entity in the forward direction only.
   * For asymmetrical relations "forward" means the entity occupies entityIds[0]
   * (the subject/source side) - inverse relations, where the entity is the target
   * (entityIds[1], e.g. the superclass/category), are excluded. Symmetrical
   * relations have no fixed direction and are always returned regardless of position.
   * @param db
   * @param entityId
   * @param relType optional relation type filter
   * @returns array of relation interfaces
   */
  static async findForwardForEntity<T extends RelationTypes.IRelation>(
    db: Connection,
    entityId: string,
    relType?: RelationEnums.Type
  ): Promise<T[]> {
    const relations = await Relation.findForEntities<T>(db, [entityId], relType);

    return relations.filter((relation) => {
      if (!RelationTypes.RelationRules[relation.type]?.asymmetrical) {
        return true;
      }
      return relation.entityIds.indexOf(entityId) === 0;
    });
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

  static async copyMany(
    request: IRequest,
    relations: Relation[],
    originalEntityId: string,
    targetEntityId: string
  ): Promise<number> {
    let relationsCopied = 0;

    for (const relation of relations) {
      // replace original entity id with cloned id
      relation.entityIds = relation.entityIds.map((id) =>
        id === originalEntityId ? targetEntityId : id
      );
      // remove original relation id - should be created anew
      relation.id = "";

      try {
        await relation.beforeSave(request);
        await relation.save(request.db.connection);
        await relation.afterSave(request);
        console.log("relation copied", relation.entityIds);
        relationsCopied++;
      } catch (e) {
        console.log("[Relation.copyMany]: failed to copy relation", e);
      }
    }

    return relationsCopied;
  }
  /**
   * Removes multiple relation entries, emitting a deletion audit for each.
   * Loads the relations first (the audit needs the snapshot) before the bulk
   * delete.
   * @param request
   * @param ids
   * @returns
   */
  static async deleteMany(
    request: IRequest,
    ids: string[]
  ): Promise<WriteResult> {
    // Delete first and emit a deletion audit only for the rows actually removed
    // (returnChanges carries their pre-delete snapshot). This mirrors the single
    // DELETE route (delete -> audit on success), so a failing delete can never
    // leave RELATION_DELETE audits for relations that still exist.
    const result = await rethink
      .table(Relation.table)
      .getAll.apply(undefined, ids)
      .delete({ returnChanges: true })
      .run(request.db.connection);

    for (const change of result.changes || []) {
      if (change.old_val) {
        await new Relation(change.old_val).afterDelete(request);
      }
    }

    return result;
  }
}
