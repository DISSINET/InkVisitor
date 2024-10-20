import { IDbModel, fillFlatObject, fillArray } from "@models/common";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { IEntity, IProp, IReference } from "@shared/types";
import { DbEnums, EntityEnums, UserEnums } from "@shared/enums";
import {
  EntityDoesNotExist,
  InternalServerError,
  InvalidDeleteError,
  ModelNotValidError,
} from "@shared/types/errors";
import User from "@models/user/user";
import Prop from "@models/prop/prop";
import { findEntityById } from "@service/shorthands";
import { IRequest } from "../../custom_typings/request";
import { sanitizeText } from "@common/functions";
import Reference from "./reference";
import { entityAllowedFields } from "@shared/types/entity";

export default class Entity implements IEntity, IDbModel {
  static table = "entities";

  id = "";
  legacyId?: string;
  class: EntityEnums.Class = EntityEnums.Class.Person;
  status: EntityEnums.Status = EntityEnums.Status.Approved;
  data: any = {};
  detail = "";
  language: EntityEnums.Language = EntityEnums.Language.Empty;
  notes: string[] = [];
  props: Prop[] = [];
  references: Reference[] = [];
  labels: string[] = [];
  isTemplate?: boolean;
  usedTemplate?: string;
  templateData?: object;

  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IEntity>) {
    fillFlatObject(this, { ...data, data: undefined });
    fillArray<Reference>(this.references, Reference, data.references);
    fillArray<Prop>(this.props, Prop, data.props);

    this.labels = data.labels || [];
    if (data.notes !== undefined) {
      this.notes = data.notes.map(sanitizeText);
    }
    if (data.legacyId !== undefined) {
      // this.legacyId = data.legacyId;
    }
    if (data.isTemplate !== undefined) {
      this.isTemplate = data.isTemplate;
    }
    if (data.usedTemplate !== undefined) {
      this.usedTemplate = data.usedTemplate;
    }
    if (data.templateData !== undefined) {
      this.templateData = data.templateData;
    }
    if (data.createdAt !== undefined) {
      this.createdAt = data.createdAt;
    }
    if (data.updatedAt !== undefined) {
      this.updatedAt = data.updatedAt;
    }
  }

  /**
   * Stores the entity in the db
   * @param db db connection
   * @returns Promise<boolean> to indicate result of the operation
   */
  async save(db: Connection | undefined): Promise<boolean> {
    this.createdAt = new Date();

    const result = await rethink
      .table(Entity.table)
      .insert({ ...this, id: this.id || undefined })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    if (result.first_error && result.first_error.indexOf("Duplicate") !== -1) {
      throw new ModelNotValidError("id already exists");
    }

    return result.inserted === 1;
  }

  /**
   * Use this method for doing asynchronous operation/checks before the save operation
   * @param db db connection
   */
  async beforeSave(db: Connection): Promise<void> {
    if (!this.isTemplate) {
      const linkedEntities = await Entity.findEntitiesByIds(
        db,
        this.getEntitiesIds()
      );
      if (linkedEntities.find((e) => e.isTemplate)) {
        throw new ModelNotValidError("cannot use template in entity instance");
      }
    }
  }

  update(
    db: Connection | undefined,
    updateData: Partial<IEntity>
  ): Promise<WriteResult> {
    // update timestamp
    this.updatedAt = updateData.updatedAt = new Date();

    // replace AND remove unwanted fields in passed object
    Object.keys(updateData).forEach(
      (key) =>
        !(key in entityAllowedFields) && delete updateData[key as keyof IEntity]
    );

    return rethink.table(Entity.table).get(this.id).update(updateData).run(db);
  }

  async getUsedByEntity(db: Connection): Promise<IEntity[]> {
    const out: Record<string, IEntity> = {};
    for (const index of DbEnums.EntityIdReferenceIndexes) {
      const entities: IEntity[] = await rethink
        .table(Entity.table)
        .getAll(this.id, { index })
        .run(db);

      for (const entity of entities) {
        out[entity.id] = entity;
      }
    }

    return Object.values(out);
  }

  async delete(db: Connection): Promise<WriteResult> {
    if (!this.id) {
      throw new InternalServerError(
        "delete called on entity with undefined id"
      );
    }

    // if bookmarks are linked to this entity, the bookmarks should be removed also
    await User.removeBookmarkedEntity(db, this.id);
    if (this.class === EntityEnums.Class.Territory) {
      await User.removeStoredTerritory(db, this.id);
    }

    const result = await rethink
      .table(Entity.table)
      .get(this.id)
      .delete()
      .run(db);

    return result;
  }

  isValid(): boolean {
    return true;
  }

  canBeViewedByUser(user: User): boolean {
    return true;
  }

  canBeCreatedByUser(user: User): boolean {
    return true;
  }

  canBeEditedByUser(user: User): boolean {
    return user.role !== UserEnums.Role.Viewer;
  }

  canBeDeletedByUser(user: User): boolean {
    return true;
  }

  /**
   * getUserRoleMode returns derived user role mode for this instance.
   * By default this method counts with default right to view - helps with
   * performance.
   * @param user
   * @returns
   */
  getUserRoleMode(user: User): UserEnums.RoleMode {
    if (user.role === UserEnums.Role.Admin) {
      return UserEnums.RoleMode.Admin;
    }

    if (this.canBeEditedByUser(user)) {
      return UserEnums.RoleMode.Write;
    }

    return UserEnums.RoleMode.Read;
  }

  static async findUsedInProps(
    db: Connection | undefined,
    entityId: string
  ): Promise<IEntity[]> {
    const entries = await rethink
      .table(Entity.table)
      .filter((row: RDatum) => {
        return row("props").contains((entry: RDatum) =>
          rethink.or(
            entry("value")("entityId").eq(entityId),
            entry("type")("entityId").eq(entityId),
            entry("children").contains((ch1: RDatum) =>
              rethink.or(
                ch1("value")("entityId").eq(entityId),
                ch1("type")("entityId").eq(entityId),
                ch1("children").contains((ch2: RDatum) =>
                  rethink.or(
                    ch2("value")("entityId").eq(entityId),
                    ch2("type")("entityId").eq(entityId),
                    ch2("children").contains((ch3: RDatum) =>
                      rethink.or(
                        ch3("value")("entityId").eq(entityId),
                        ch3("type")("entityId").eq(entityId)
                      )
                    )
                  )
                )
              )
            )
          )
        );
      })
      .run(db);

    return entries;
  }

  /**
   * Returns entity ids that are present in data fields
   * @returns list of ids
   */
  getEntitiesIds(): string[] {
    const entityIds: Record<string, null> = {};

    Entity.extractIdsFromProps(this.props).forEach((element) => {
      if (element) {
        entityIds[element] = null;
      }
    });

    Entity.extractIdsFromReferences(this.references).forEach((element) => {
      if (element) {
        entityIds[element] = null;
      }
    });

    return Object.keys(entityIds);
  }

  getMainLabel(): string | null {
    return this.labels && this.labels.length > 0 ? this.labels[0] : null;
  }

  /**
   * Applies the template for entity.
   * @param db
   * @param tplId
   */
  async applyTemplate(req: IRequest, tplId: string): Promise<void> {
    const template = await findEntityById(req.db.connection, tplId);
    if (!template) {
      throw new EntityDoesNotExist(`Can't apply template - ${tplId} not found`);
    }

    this.usedTemplate = tplId;
    this.isTemplate = false;
    if (!this.getMainLabel() && template.labels && template.labels.length > 0) {
      this.labels = [`${template.labels[0]} (from template)`];
    }
    await this.update(req.db.connection, {
      usedTemplate: this.usedTemplate,
      isTemplate: this.isTemplate,
      labels: this.labels,
    });
  }

  static extractIdsFromReferences(references: IReference[]): string[] {
    const out: string[] = [];
    for (const reference of references) {
      out.push(reference.resource);
      out.push(reference.value);
    }

    return out;
  }

  static extractIdsFromProps(
    props: IProp[] = [],
    cb?: (prop: IProp) => void
  ): string[] {
    let out: string[] = [];
    for (const prop of props) {
      if (prop.type) {
        out.push(prop.type.entityId);
      }
      if (prop.value) {
        out.push(prop.value.entityId);
      }

      if (cb) {
        cb(prop);
      }

      out = out.concat(Entity.extractIdsFromProps(prop.children, cb));
    }

    return out;
  }

  static async findEntitiesByIds(
    con: Connection,
    ids: string[]
  ): Promise<IEntity[]> {
    if (ids.findIndex((id) => !id) !== -1) {
      console.trace("Passed empty id to Entity.findEntitiesByIds");
    }

    const data = await rethink
      .table(Entity.table)
      .getAll(rethink.args(ids))
      .run(con);
    return data;
  }

  async getEntities(db: Connection): Promise<IEntity[]> {
    return Entity.findEntitiesByIds(db, this.getEntitiesIds());
  }

  /**
   * Finds entities which uses this entity as a template
   * @param db
   * @returns
   */
  async findFromTemplate(db: Connection): Promise<IEntity[]> {
    const data = await rethink
      .table(Entity.table)
      .getAll(this.id, { index: DbEnums.Indexes.EntityUsedTemplate })
      .run(db);

    return data;
  }

  /**
   * Resets IDs of nested objects
   */
  resetIds() {
    // make sure the id will be created anew
    this.id = "";
    this.props.forEach((p) => p.resetIds());
    this.references.forEach((p) => p.resetIds());
  }
}
