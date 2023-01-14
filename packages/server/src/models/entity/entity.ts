import {
  IDbModel,
  fillFlatObject,
  fillArray,
} from "@models/common";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { IEntity, IProp, IReference } from "@shared/types";
import {
  DbEnums,
  EntityEnums,
  UserEnums,
} from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";
import emitter from "@models/events/emitter";
import { EventTypes } from "@models/events/types";
import Prop from "@models/prop/prop";

export default class Entity implements IEntity, IDbModel {
  static table = "entities";

  id: string = "";
  legacyId?: string;
  class: EntityEnums.Class = EntityEnums.Class.Person;
  status: EntityEnums.Status = EntityEnums.Status.Approved;
  data: any = {};
  label: string = "";
  detail: string = "";
  language: EntityEnums.Language = EntityEnums.Language.Latin;
  notes: string[] = [];
  props: Prop[] = [];
  references: IReference[] = [];

  isTemplate?: boolean;
  usedTemplate?: string;
  templateData?: object;

  constructor(data: Partial<IEntity>) {
    fillFlatObject(this, { ...data, data: undefined });
    fillArray(this.references, Object, data.references);
    fillArray(this.notes, String, data.notes);
    fillArray<Prop>(this.props, Prop, data.props);

    if (data.legacyId !== undefined) {
      this.legacyId = data.legacyId;
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
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(Entity.table)
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
    return rethink.table(Entity.table).get(this.id).update(updateData).run(db);
  }

  async delete(db: Connection | undefined): Promise<WriteResult> {
    if (!this.id) {
      throw new InternalServerError(
        "delete called on entity with undefined id"
      );
    }

    if (db) {
      await emitter.emit(EventTypes.BEFORE_ENTITY_DELETE, db, this.id);
    }

    const result = await rethink
      .table(Entity.table)
      .get(this.id)
      .delete()
      .run(db);

    if (result.deleted && db) {
      await emitter.emit(EventTypes.AFTER_ENTITY_DELETE, db, this.id);
    }

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

    // get usedTemplate entity
    if (this.usedTemplate) {
      entityIds[this.usedTemplate] = null
    }

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


  static extractIdsFromReferences(references: IReference[]): string[] {
    let out: string[] = [];
    for (const reference of references) {
      out.push(reference.resource);
      out.push(reference.value);
    }

    return out;
  }

  static extractIdsFromProps(props: IProp[] = [], cb?: (prop: IProp) => void): string[] {
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
}
