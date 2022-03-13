import {
  IDbModel,
  UnknownObject,
  fillFlatObject,
  fillArray,
} from "@models/common";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import {
  IStatement,
  IEntity,
  IResponseEntity,
  IProp,
  IEntityReference,
} from "@shared/types";
import {
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
import { findEntitiesByIds } from "@service/shorthands";
import Base from "../base";

export default class Entity extends Base implements IEntity, IDbModel {
  static table = "entities";
  static publicFields: string[] = [
    "id",
    "legacyId",
    "class",
    "status",
    "data",
    "label",
    "detail",
    "status",
    "language",
    "notes",
    "props",
    "references",
    "isTemplate",
    "usedTemplate",
    "templateData",
  ];

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
  references: IEntityReference[] = [];

  isTemplate: boolean = false;
  usedTemplate: boolean = false;
  templateData: object = {};

  usedIn: IStatement[] = [];
  right: UserRoleMode = UserRoleMode.Read;

  constructor(data: UnknownObject) {
    super();

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
    return true;
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

  getDependentStatements(db: Connection | undefined): Promise<IStatement[]> {
    return rethink
      .table(Entity.table)
      .filter({ class: EntityClass.Statement })
      .filter((row: any) => {
        return rethink.or(
          row("data")("actants").contains((actantElement: any) =>
            actantElement("actant").eq(this.id)
          ),
          row("data")("props").contains((propElement: any) =>
            propElement("origin").eq(this.id)
          )
        );
      })
      .run(db);
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
            entry("value")("id").eq(entityId),
            entry("type")("id").eq(entityId),
            entry("children").contains((ch1: RDatum) =>
              rethink.or(
                ch1("value")("id").eq(entityId),
                ch1("type")("id").eq(entityId),
                ch1("children").contains((ch2: RDatum) =>
                  rethink.or(
                    ch2("value")("id").eq(entityId),
                    ch2("type")("id").eq(entityId),
                    ch2("children").contains((ch3: RDatum) =>
                      rethink.or(
                        ch3("value")("id").eq(entityId),
                        ch3("type")("id").eq(entityId)
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

    return Object.keys(entityIds);
  }

  static extractIdsFromProps(props: IProp[]): string[] {
    let out: string[] = [];
    for (const prop of props) {
      out.push(prop.type.id);
      out.push(prop.value.id);

      out = out.concat(Entity.extractIdsFromProps(prop.children));
    }

    return out;
  }

  async getEntities(db: Connection): Promise<IEntity[]> {
    const entities = findEntitiesByIds<IEntity>(db, this.getEntitiesIds());
    return entities;
  }

  /*
   * finds statements which are linked to current entity
   * @param db db connection
   * @param territoryId id of the entity
   * @returns list of statements data
   */
  async findDependentStatements(
    db: Connection | undefined
  ): Promise<IStatement[]> {
    const statements = await rethink
      .table(Entity.table)
      .filter({
        class: EntityClass.Statement,
      })
      .filter((row: RDatum) => {
        return rethink.or(
          row("data")("territory")("id").eq(this.id),
          row("data")("actions").contains((entry: RDatum) =>
            entry("action").eq(this.id)
          ),
          row("data")("actants").contains((entry: RDatum) =>
            entry("actant").eq(this.id)
          ),
          row("data")("tags").contains(this.id),
          row("data")("props").contains((entry: RDatum) =>
            entry("value")("id").eq(this.id)
          ),
          row("data")("props").contains((entry: RDatum) =>
            entry("type")("id").eq(this.id)
          ),
          row("data")("props").contains((entry: RDatum) =>
            entry("origin").eq(this.id)
          ),
          row("data")("references").contains((entry: RDatum) =>
            entry("resource").eq(this.id)
          )
        );
      })
      .run(db);

    return statements.sort((a, b) => {
      return a.data.territory.order - b.data.territory.order;
    });
  }

  async prepareResponseFields(user: User, db: Connection | undefined) {
    this.usedIn = await this.findDependentStatements(db);
    this.right = this.getUserRoleMode(user);
  }

  static getPublicFields(a: Entity): string[] {
    return Object.keys(a).filter((k) => k.indexOf("_") !== 0);
  }

  toJSON(): IResponseEntity {
    const entity = this;
    const strippedObject: IEntity = Entity.getPublicFields(this).reduce(
      (acc, curr) => {
        acc[curr] = (entity as Record<string, unknown>)[curr];
        return acc;
      },
      {} as any
    );

    return strippedObject;
  }
}
