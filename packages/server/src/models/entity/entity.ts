import {
  IDbModel,
  UnknownObject,
  fillFlatObject,
  fillArray,
} from "@models/common";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { IStatement, IEntity, IProp, IReference } from "@shared/types";
import {
  DbIndex,
  EntityClass,
  EntityStatus,
  Language,
  Order,
  UserRole,
  UserRoleMode,
} from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";
import emitter from "@models/events/emitter";
import { EventTypes } from "@models/events/types";

export default class Entity implements IEntity, IDbModel {
  static table = "entities";

  id: string = "";
  legacyId: string = "";
  class: EntityClass = EntityClass.Person;
  status: EntityStatus = EntityStatus.Approved;
  data: any = {};
  label: string = "";
  detail: string = "";
  language: Language = Language.Latin;
  notes: string[] = [];
  props: IProp[] = [];
  references: IReference[] = [];

  isTemplate: boolean = false;
  usedTemplate: string = "";
  templateData: object = {};

  usedIn: IStatement[] = [];
  right: UserRoleMode = UserRoleMode.Read;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, { ...data, data: undefined });
    fillArray(this.references, Object, data.references);
    fillArray(this.notes, String, data.notes);
    fillArray(this.props, Object, data.props);
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
    return user.role !== UserRole.Viewer;
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
  getUserRoleMode(user: User): UserRoleMode {
    if (user.role === UserRole.Admin) {
      return UserRoleMode.Admin;
    }

    if (this.canBeEditedByUser(user)) {
      return UserRoleMode.Write;
    }

    return UserRoleMode.Read;
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

  static determineOrder(want: number, sibl: Record<number, unknown>): number {
    const sortedOrders: number[] = Object.keys(sibl)
      .map((k) => parseFloat(k))
      .sort((a, b) => a - b);

    if (!sortedOrders.length) {
      // no sibling - use default position 0
      return 0;
    }

    if (want === undefined) {
      // if want is not provided, use Last position by default
      want = Order.Last;
    }

    if (want === Order.Last) {
      return sortedOrders[sortedOrders.length - 1] + 1;
    } else if (want === Order.First) {
      return sortedOrders[0] - 1;
    }

    let out = -1;

    if (sibl[want]) {
      // if there is a conflict - wanted order value already exists
      for (let i = 0; i < sortedOrders.length; i++) {
        if (sortedOrders[i] === want) {
          if (sortedOrders.length === i + 1) {
            // conflict occured on the biggest number - use closest bigger free integer
            const ceiled = Math.ceil(sortedOrders[i]);
            out = ceiled === sortedOrders[i] ? ceiled + 1 : ceiled;
            break;
          }

          // new number would be somewhere behind the wanted position(i) and before
          // the next position(i+1)
          out = sortedOrders[i] + (sortedOrders[i + 1] - sortedOrders[i]) / 2;
          if (!sibl[Math.round(out)]) {
            out = Math.round(out);
          }

          break;
        }
      }
    } else {
      // all good
      out = want;
      // less than zero -> zero optional fix
      if (out < 0 && (sortedOrders.length === 0 || sortedOrders[0] > 0)) {
        out = 0;
      }
    }

    return out;
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

  static extractIdsFromReferences(references: IReference[]): string[] {
    let out: string[] = [];
    for (const reference of references) {
      out.push(reference.resource);
      out.push(reference.value);
    }

    return out;
  }

  static extractIdsFromProps(props: IProp[] = []): string[] {
    let out: string[] = [];
    for (const prop of props) {
      if (prop.type) {
        out.push(prop.type.entityId);
      }
      if (prop.value) {
        out.push(prop.value.entityId);
      }

      out = out.concat(Entity.extractIdsFromProps(prop.children));
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
    const entities = Entity.findEntitiesByIds(db, this.getEntitiesIds());
    return entities;
  }

  /**
   * Finds entities which uses this entity as a template
   * @param db
   * @returns
   */
  async findFromTemplate(db: Connection): Promise<IEntity[]> {
    const data = await rethink
      .table(Entity.table)
      .getAll(this.id, { index: DbIndex.EntityUsedTemplate })
      .run(db);

    return data;
  }
}
