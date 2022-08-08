import {
  IStatement,
  IStatementData,
  IStatementActant,
  IStatementAction,
  IReference,
} from "@shared/types";
import {
  fillFlatObject,
  fillArray,
  UnknownObject,
  IModel,
} from "@models/common";
import {
  EntityClass,
  Certainty,
  Elvl,
  Position,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
  Operator,
  UserRole,
  UserRoleMode,
  DbIndex,
} from "@shared/enums";

import Entity from "@models/entity/entity";
import { r as rethink, Connection, RDatum, WriteResult } from "rethinkdb-ts";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";
import { EventMapSingle, EventTypes } from "@models/events/types";
import treeCache from "@service/treeCache";
import Prop from "@models/prop/prop";
import e from "express";

export class StatementActant implements IStatementActant, IModel {
  id = "";
  actant = "";
  position: Position = Position.Subject;
  elvl: Elvl = Elvl.Textual;
  logic: Logic = Logic.Positive;
  virtuality: Virtuality = Virtuality.Reality;
  partitivity: Partitivity = Partitivity.Unison;
  bundleOperator: Operator = Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;
  props: Prop[] = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    // TODO: If admin ? model.status = EntityStatus.Approved : model.status = EntityStatus.Pending

    fillFlatObject(this, data);
    fillArray<Prop>(this.props, Prop, data.props);
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    return true;
  }
}

export class StatementTerritory {
  id = "";
  order = -1;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }
    fillFlatObject(this, data);
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    // order is optional, it will be fixed in underlaying call to
    // Entity.determineOrder
    if (this.id === "") {
      return false;
    }

    return true;
  }
}

export class StatementAction implements IStatementAction {
  id = "";
  action: string = "";
  elvl: Elvl = Elvl.Textual;
  certainty: Certainty = Certainty.Empty;
  logic: Logic = Logic.Positive;
  mood: Mood[] = [Mood.Indication];
  moodvariant: MoodVariant = MoodVariant.Realis;
  bundleOperator: Operator = Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;
  props: Prop[] = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }
    fillFlatObject(this, data);
    fillArray(this.mood, String, data.mood);
    fillArray<Prop>(this.props, Prop, data.props);
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    // order is optional, it will be moved to last position if empty
    if (this.id === "") {
      return false;
    }

    return true;
  }
}

export class StatementData implements IModel, IStatementData {
  text = "";
  territory? = new StatementTerritory({});
  actions: StatementAction[] = [];
  actants: StatementActant[] = [];
  tags: string[] = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    if (data.territory) {
      this.territory = new StatementTerritory(data.territory as UnknownObject);
    } else {
      delete this.territory;
    }
    fillArray<StatementAction>(this.actions, StatementAction, data.actions);
    fillArray<StatementActant>(this.actants, StatementActant, data.actants);

    if (data.territory) {
    }
    // fill array uses constructors - which string[] cannot use (will create an
    // object instead of string type)
    if (data.tags) {
      for (const tag of data.tags as string[]) {
        this.tags.push(tag);
      }
    }
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    if ("territory" in this && !this.territory?.isValid()) {
      return false;
    }
    if (this.actions.find((a) => !a.isValid())) {
      return false;
    }
    if (this.actants.find((a) => !a.isValid())) {
      return false;
    }

    return true;
  }
}

class Statement extends Entity implements IStatement {
  class: EntityClass.Statement = EntityClass.Statement;
  data: StatementData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new StatementData(data.data as UnknownObject);
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    if (this.class != EntityClass.Statement) {
      return false;
    }

    return this.data.isValid();
  }

  canBeEditedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserRole.Admin) {
      return true;
    }

    // editors should be able to access META statements
    if (
      user.role === UserRole.Editor &&
      this.data.territory &&
      this.data.territory.id === "T0"
    ) {
      return true;
    }

    if (this.data.territory) {
      const closestRight = treeCache.getRightForTerritory(
        this.data.territory.id,
        user.rights
      );
      if (!closestRight) {
        return false;
      }
      return (
        closestRight.mode === UserRoleMode.Admin ||
        closestRight.mode === UserRoleMode.Write
      );
    }
    return true;
  }

  canBeViewedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserRole.Admin) {
      return true;
    }

    if (this.data.territory) {
      return !!treeCache.getRightForTerritory(
        this.data.territory.id,
        user.rights
      );
    } else {
      return true;
    }
  }

  canBeDeletedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserRole.Admin) {
      return true;
    }

    return false;
  }

  /**
   * Stores the statement data in the db
   * @param db db connection
   * @returns write result of the db operation
   */
  async save(db: Connection | undefined): Promise<WriteResult> {
    const siblings = await this.findTerritorySiblings(db);
    if (this.data.territory) {
      this.data.territory.order = Entity.determineOrder(
        this.data.territory.order,
        siblings
      );
    }

    const res = await super.save(db);

    await treeCache.initialize();

    return res;
  }

  /**
   * Updates the statement db entry. This method attempts to alter the
   * territory.order value to better fit the real number value.
   * @param db db connection
   * @param updateData raw data object to be merged with db entry
   * @returns write result of the db operation
   */
  async update(
    db: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    if (
      updateData["data"] &&
      (updateData["data"] as any).territory &&
      this.data.territory
    ) {
      const territoryData = (updateData["data"] as any).territory;
      if (territoryData.id) {
        this.data.territory.id = territoryData.id;
      }
      if (!this.data.territory.id) {
        throw new InternalServerError("territory id has to be set");
      }

      const wantedOrder = territoryData.order;

      const siblings = await this.findTerritorySiblings(db);
      this.data.territory.order = Entity.determineOrder(wantedOrder, siblings);
      territoryData.order = this.data.territory.order;
    }

    const result = await super.update(db, updateData);

    await treeCache.initialize();

    return result;
  }

  async delete(db: Connection | undefined): Promise<WriteResult> {
    const result = await super.delete(db);

    await treeCache.initialize();

    return result;
  }

  /**
   * Finds statements that are stored under the same territory (while not being
   * the same statement as the received)
   * @param db db connection
   * @returns map of order value as the key and statement data as the value
   */
  async findTerritorySiblings(
    db: Connection | undefined
  ): Promise<Record<number, IStatement>> {
    if (this.data.territory) {
      const list: IStatement[] = await rethink
        .table(Entity.table)
        .getAll(this.data.territory.id, { index: DbIndex.StatementTerritory })
        .run(db);

      const out: Record<number, IStatement> = {};

      for (const ter of list) {
        if (ter.id === this.id) {
          continue;
        }
        if (ter.data.territory) {
          out[ter.data.territory.order] = ter;
        }
      }

      return out;
    } else {
      return [];
    }
  }

  /**
   * Returns actant ids that are present in data fields
   * @returns list of ids
   */
  getEntitiesIds(): string[] {
    const entitiesIds: Record<string, null> = {};

    // get ids from Entity.props ( + childs)
    new Entity({}).getEntitiesIds.call(this).forEach((element) => {
      entitiesIds[element] = null;
    });

    //  get ids from Statement.data.actions, Statement.data.actions.props ( + childs)
    this.data.actions.forEach((a) => {
      entitiesIds[a.action] = null;
      if (a.props) {
        Entity.extractIdsFromProps(a.props).forEach((element) => {
          entitiesIds[element] = null;
        });
      }
    });

    // get ids from Statement.data.actants, Statement.data.actants.props ( + childs)
    this.data.actants.forEach((a) => {
      entitiesIds[a.actant] = null;
      Entity.extractIdsFromProps(a.props).forEach((element) => {
        entitiesIds[element] = null;
      });
    });

    if (this.data.territory) {
      entitiesIds[this.data.territory.id] = null;
    }

    Entity.extractIdsFromReferences(this.references).forEach((element) => {
      if (element) {
        entitiesIds[element] = null;
      }
    });

    this.data.tags.forEach((t) => (entitiesIds[t] = null));

    return Object.keys(entitiesIds);
  }

  async unlinkActantId(
    db: Connection,
    actantIdToUnlink: string
  ): Promise<boolean> {
    const indexToRemove = this.data.actants.findIndex(
      (a) => a.actant === actantIdToUnlink
    );
    if (indexToRemove === -1) {
      return false;
    }

    this.data.actants.splice(indexToRemove, 1);
    const result = await this.update(db, {
      data: { actants: this.data.actants },
    });
    return !!result.replaced;
  }

  async unlinkActionId(
    db: Connection,
    actantIdToUnlink: string
  ): Promise<boolean> {
    const indexToRemove = this.data.actions.findIndex(
      (a) => a.action === actantIdToUnlink
    );
    if (indexToRemove === -1) {
      return false;
    }

    this.data.actions.splice(indexToRemove, 1);
    const result = await this.update(db, {
      data: { actions: this.data.actions },
    });
    return !!result.replaced;
  }

  static extractIdsFromReference(references: IReference[]): string[] {
    let out: string[] = [];
    for (const reference of references) {
      out.push(reference.resource);
      out.push(reference.value);
    }

    return out;
  }

  /**
   * getEntitiesIdsForMany wrapped in foreach cycle
   * @param statements list of scanned statements
   * @returns list of ids unique for multiple statements
   */
  static getEntitiesIdsForMany(statements: IStatement[]): string[] {
    const entityIds: Record<string, null> = {}; // unique check

    const stModel = new Statement(undefined);
    for (const statement of statements) {
      stModel.getEntitiesIds
        .call(statement)
        .forEach((id) => (entityIds[id] = null));
    }

    return Object.keys(entityIds);
  }

  /**
   * finds statements which are under specific territory
   * @param db db connection
   * @param territoryId id of the territory
   * @returns list of statements data
   */
  static async findStatementsInTerritory(
    db: Connection | undefined,
    territoryId: string
  ): Promise<IStatement[]> {
    const statements = await rethink
      .table(Entity.table)
      .filter({
        class: EntityClass.Statement,
      })
      .filter((row: RDatum) => {
        return row("data")("territory")("id").eq(territoryId);
      })
      .run(db);

    return statements.sort((a, b) => {
      return a.data.territory.order - b.data.territory.order;
    });
  }

  /**
   * finds statements which are linked to different entity
   * in other words, find statements which store passed entity id in on of their possible fields
   * @param db db connection
   * @param entityId id of the entity
   * @returns list of statements data
   */
  static async findByDataEntityId(
    db: Connection | undefined,
    entityId: string
  ): Promise<IStatement[]> {
    const statements = await rethink
      .table(Entity.table)
      .getAll(entityId, { index: DbIndex.StatementEntities })
      .run(db);

    return statements.sort((a, b) => {
      if (!a.data.territory) {
        return 1;
      } else if (!b.data.territory) {
        return -1;
      } else {
        return a.data.territory.order - b.data.territory.order;
      }
    });
  }

  /**
   * reduces findByDataEntityId results to list of ids
   * @param db db connection
   * @param entityId id of the entity
   * @returns list of statements ids
   */
  static async findIdsByDataEntityId(
    db: Connection | undefined,
    entityId: string
  ): Promise<string[]> {
    const statements = await Statement.findByDataEntityId(db, entityId);

    const entityIds: string[] = [];

    (statements as IStatement[]).forEach((s) => {
      const ids = s.data.actants.map((a) => a.actant);
      entityIds.push(...ids);
    });

    return entityIds;
  }

  /**
   * finds statements which are linked to entity using
   * statement.data.actions[].props or statement.data.actants[].props
   * searches also in props.children to lvl3
   * @param db db connection
   * @param entityId id of the entity
   * @returns list of statements data
   */
  static async findByDataPropsId(
    db: Connection | undefined,
    entityId: string
  ): Promise<IStatement[]> {
    const statements = await rethink
      .table(Entity.table)
      .filter({
        class: EntityClass.Statement,
      })
      .filter((row: RDatum) => {
        return rethink.or(
          row("data")("actions").contains((action: RDatum) =>
            action("props").contains((entry: RDatum) =>
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
            )
          ),
          row("data")("actants").contains((actant: RDatum) =>
            actant("props").contains((prop: RDatum) =>
              rethink.or(
                prop("value")("id").eq(entityId),
                prop("type")("id").eq(entityId),
                prop("children").contains((ch1: RDatum) =>
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
            )
          )
        );
      })
      .run(db);

    return statements.sort((a, b) => {
      return a.data.territory.order - b.data.territory.order;
    });
  }

  /**
   * finds statements that are linked via data.actants array to wanted actant
   * id and are linked to the root territory
   * @param db db connection
   * @param actantId id of the actant
   * @returns list of statement objects sorted by territory order
   */
  static async findMetaStatements(
    db: Connection | undefined,
    actantId: string
  ): Promise<Statement[]> {
    const statements = await rethink
      .table(Entity.table)
      .filter({
        class: EntityClass.Statement,
      })
      .filter((row: RDatum) => {
        return rethink.and(
          row("data")("actants").contains((entry: RDatum) =>
            entry("actant").eq(actantId)
          ),
          row("data")("territory")("id").eq("T0")
        );
      })
      .run(db);

    return statements
      .sort((a, b) => {
        return a.data.territory.order - b.data.territory.order;
      })
      .map((s) => new Statement({ ...s }));
  }

  static events: EventMapSingle = {
    [EventTypes.BEFORE_ENTITY_DELETE]: async (
      db: Connection,
      actantId: string
    ): Promise<void> => {
      const linkedToActant = await rethink
        .table(Entity.table)
        .filter({ class: EntityClass.Statement })
        .filter((row: any) => {
          return row("data")("actants").contains((actantElement: any) =>
            actantElement("actant").eq(actantId)
          );
        })
        .run(db);

      for (const stData of linkedToActant) {
        const st = new Statement({ ...stData });
        await st.unlinkActantId(db, actantId);
      }

      const linkedToProps = await rethink
        .table(Entity.table)
        .filter({ class: EntityClass.Statement })
        .filter((row: any) => {
          return row("data")("props").contains((actantElement: any) =>
            actantElement("origin").eq(actantId)
          );
        })
        .run(db);

      const linkedToActions = await rethink
        .table(Entity.table)
        .filter({ class: EntityClass.Statement })
        .filter((row: any) => {
          return row("data")("actions").contains((actantElement: any) =>
            actantElement("action").eq(actantId)
          );
        })
        .run(db);

      for (const stData of linkedToActions) {
        const st = new Statement({ ...stData });
        await st.unlinkActionId(db, actantId);
      }
    },
  };
}

export default Statement;
