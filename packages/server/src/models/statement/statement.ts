import {
  IStatement,
  IStatementData,
  IStatementActant,
  IStatementAction,
  IReference,
  IProp,
} from "@shared/types";
import {
  fillFlatObject,
  fillArray,
  IModel,
  determineOrder,
} from "@models/common";
import { EntityEnums, UserEnums, DbEnums } from "@shared/enums";

import Entity from "@models/entity/entity";
import { r as rethink, Connection, RDatum, WriteResult } from "rethinkdb-ts";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";
import { EventMapSingle, EventTypes } from "@models/events/types";
import treeCache from "@service/treeCache";
import Prop from "@models/prop/prop";
import {
  IStatementClassification,
  IStatementDataTerritory,
  IStatementIdentification,
  StatementObject,
} from "@shared/types/statement";

export class StatementClassification implements IStatementClassification {
  id: string = "";
  entityId: string = "";
  elvl: EntityEnums.Elvl = EntityEnums.Elvl.Textual;
  logic: EntityEnums.Logic = EntityEnums.Logic.Positive;
  certainty: EntityEnums.Certainty = EntityEnums.Certainty.AlmostCertain;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant = EntityEnums.MoodVariant.Irrealis;
  statementOrder: number | false = false;

  constructor(data: Partial<IStatementClassification>) {
    fillFlatObject(this, data);
    this.mood = data.mood ? data.mood : [];
    this.statementOrder =
      data.statementOrder !== undefined ? data.statementOrder : false;
  }
}

export class StatementIdentification implements IStatementClassification {
  id: string = "";
  entityId: string = "";
  elvl: EntityEnums.Elvl = EntityEnums.Elvl.Textual;
  logic: EntityEnums.Logic = EntityEnums.Logic.Positive;
  certainty: EntityEnums.Certainty = EntityEnums.Certainty.AlmostCertain;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant = EntityEnums.MoodVariant.Irrealis;
  statementOrder: number | false = false;

  constructor(data: Partial<IStatementClassification>) {
    fillFlatObject(this, data);
    this.mood = data.mood || [EntityEnums.Mood.Indication];
    this.statementOrder =
      data.statementOrder !== undefined ? data.statementOrder : false;
  }
}

export class StatementActant implements IStatementActant, IModel {
  id = "";
  entityId = "";
  position: EntityEnums.Position = EntityEnums.Position.Subject;
  elvl: EntityEnums.Elvl = EntityEnums.Elvl.Textual;
  logic: EntityEnums.Logic = EntityEnums.Logic.Positive;
  virtuality: EntityEnums.Virtuality = EntityEnums.Virtuality.Reality;
  partitivity: EntityEnums.Partitivity = EntityEnums.Partitivity.Unison;
  bundleOperator: EntityEnums.Operator = EntityEnums.Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;
  props: Prop[] = [];
  statementOrder: number | false = false;

  classifications: StatementClassification[] = [];
  identifications: StatementIdentification[] = [];

  constructor(data: Partial<IStatementActant>) {
    fillFlatObject(this, data);
    fillArray<Prop>(this.props, Prop, data.props);
    fillArray<StatementClassification>(
      this.classifications,
      StatementClassification,
      data.classifications
    );
    fillArray<StatementIdentification>(
      this.identifications,
      StatementIdentification,
      data.identifications
    );
    this.statementOrder =
      data.statementOrder !== undefined ? data.statementOrder : false;
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    return true;
  }
}

export class StatementTerritory implements IStatementDataTerritory {
  territoryId: string;
  order: number;

  constructor(data: Partial<IStatementDataTerritory>) {
    this.territoryId = data.territoryId as string;
    this.order = data.order !== undefined ? data.order : -1;
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    // order is optional, it will be fixed in underlaying call to
    // Entity.determineOrder
    if (!this.territoryId) {
      return false;
    }

    return true;
  }
}

export class StatementAction implements IStatementAction {
  id = "";
  actionId: string = "";
  elvl: EntityEnums.Elvl = EntityEnums.Elvl.Textual;
  certainty: EntityEnums.Certainty = EntityEnums.Certainty.Empty;
  logic: EntityEnums.Logic = EntityEnums.Logic.Positive;
  mood: EntityEnums.Mood[];
  moodvariant: EntityEnums.MoodVariant = EntityEnums.MoodVariant.Realis;
  bundleOperator: EntityEnums.Operator = EntityEnums.Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;
  props: Prop[] = [];
  statementOrder: number | false = false;

  constructor(data: Partial<IStatementAction>) {
    fillFlatObject(this, data);
    this.mood = data.mood || [EntityEnums.Mood.Indication];
    fillArray<Prop>(this.props, Prop, data.props);
    this.statementOrder =
      data.statementOrder !== undefined ? data.statementOrder : false;
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

export class StatementData implements IStatementData, IModel {
  text = "";
  territory?: StatementTerritory;
  actions: StatementAction[] = [];
  actants: StatementActant[] = [];
  tags: string[] = [];

  constructor(data: Partial<IStatementData>) {
    fillFlatObject(this, data);
    if (data.territory) {
      this.territory = new StatementTerritory(data.territory || {});
    }

    fillArray<StatementAction>(this.actions, StatementAction, data.actions);
    fillArray<StatementActant>(this.actants, StatementActant, data.actants);

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
  class: EntityEnums.Class.Statement = EntityEnums.Class.Statement;
  data: StatementData;

  constructor(data: Partial<IStatement>) {
    super(data);
    this.data = new StatementData(data.data || {});
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    if (this.class != EntityEnums.Class.Statement) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }

  canBeEditedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserEnums.Role.Admin) {
      return true;
    }

    // editors should be able to access META statements
    if (
      user.role === UserEnums.Role.Editor &&
      this.data.territory &&
      this.data.territory.territoryId === "T0"
    ) {
      return true;
    }

    if (this.data.territory) {
      const closestRight = treeCache.getRightForTerritory(
        this.data.territory.territoryId,
        user.rights
      );
      if (!closestRight) {
        return false;
      }
      return (
        closestRight.mode === UserEnums.RoleMode.Admin ||
        closestRight.mode === UserEnums.RoleMode.Write
      );
    }
    return true;
  }

  canBeViewedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserEnums.Role.Admin) {
      return true;
    }

    if (this.data.territory) {
      return !!treeCache.getRightForTerritory(
        this.data.territory.territoryId,
        user.rights
      );
    } else {
      return true;
    }
  }

  canBeDeletedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserEnums.Role.Admin) {
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
      this.data.territory.order = determineOrder(
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
      if (territoryData.territoryId) {
        this.data.territory.territoryId = territoryData.territoryId;
      }
      if (!this.data.territory.territoryId) {
        throw new InternalServerError("territory id has to be set");
      }

      const wantedOrder = territoryData.order;

      const siblings = await this.findTerritorySiblings(db);
      this.data.territory.order = determineOrder(wantedOrder, siblings);
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
        .getAll(this.data.territory.territoryId, {
          index: DbEnums.Indexes.StatementTerritory,
        })
        .run(db);

      const out: Record<number, IStatement> = {};

      for (const sibling of list) {
        if (sibling.id === this.id) {
          continue;
        }
        if (sibling.data.territory) {
          out[sibling.data.territory.order] = sibling;
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

    // get ids from Entity.props ( + childs), references and template
    new Entity({}).getEntitiesIds.call(this).forEach((element) => {
      entitiesIds[element] = null;
    });

    //  get ids from Statement.data.actions, Statement.data.actions.props ( + childs)
    this.data.actions?.forEach((a) => {
      entitiesIds[a.actionId] = null;
      if (a.props) {
        Entity.extractIdsFromProps(a.props).forEach((element) => {
          entitiesIds[element] = null;
        });
      }
    });

    // get ids from Statement.data.actants, Statement.data.actants[].props ( + childs),
    // Statement.data.actants[].classifications, Statement.data.actants[].identifications
    this.data.actants?.forEach((a) => {
      entitiesIds[a.entityId] = null;
      a.classifications?.forEach((ca) => (entitiesIds[ca.entityId] = null));
      a.identifications?.forEach((ci) => (entitiesIds[ci.entityId] = null));

      Entity.extractIdsFromProps(a.props).forEach((element) => {
        entitiesIds[element] = null;
      });
    });

    if (this.data.territory) {
      entitiesIds[this.data.territory.territoryId] = null;
    }

    this.data.tags.forEach((t) => (entitiesIds[t] = null));

    return Object.keys(entitiesIds).filter((id) => !!id);
  }

  walkObjects(cb: (o: StatementObject) => void) {
    // statement.props
    Entity.extractIdsFromProps(this.props, cb);

    // statement.actions
    for (const action of this.data.actions) {
      cb(action);

      // statement.actions.props
      Entity.extractIdsFromProps(action.props, cb);
    }

    // statement.actants
    for (const actant of this.data.actants) {
      cb(actant);

      // statement.actants.props
      Entity.extractIdsFromProps(actant.props, cb);

      // statement.actants.classifications
      for (const classification of actant.classifications) {
        cb(classification);
      }

      // statement.actants.identifications
      for (const identification of actant.identifications) {
        cb(identification);
      }
    }
  }

  async unlinkActantId(
    db: Connection,
    actantIdToUnlink: string
  ): Promise<boolean> {
    const indexToRemove = this.data.actants.findIndex(
      (a) => a.entityId === actantIdToUnlink
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
      (a) => a.actionId === actantIdToUnlink
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
   * Finds statements with data.territoryId.id set to required values
   * @param db
   * @param territoryId
   * @returns {Statement[]} list of found statements
   */
  static async findByTerritoryIds(
    db: Connection,
    territoryIds: string[]
  ): Promise<Statement[]> {
    const list: IStatement[] = await rethink
      .table(Entity.table)
      .getAll.apply(
        undefined,
        (territoryIds as (string | { index: string })[]).concat({
          index: DbEnums.Indexes.StatementTerritory,
        })
      )
      .run(db);

    return list.map((data) => new Statement(data));
  }

  /**
   * getEntitiesIdsForMany wrapped in foreach cycle
   * @param statements list of scanned statements
   * @returns list of ids unique for multiple statements
   */
  static getEntitiesIdsForMany(statements: IStatement[]): string[] {
    const entityIds: Record<string, null> = {}; // unique check

    const stModel = new Statement({});
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
        class: EntityEnums.Class.Statement,
      })
      .filter((row: RDatum) => {
        return row("data")("territory")("territoryId").eq(territoryId);
      })
      .run(db);

    return statements.sort((a, b) => {
      return a.data.territory.order - b.data.territory.order;
    });
  }

  /**
   * finds statements which are linked to different entity
   * in other words, find statements which store passed entity id in one of their possible fields
   * @param db db connection
   * @param entityId id of the entity
   * @returns list of statements data
   */
  static async getLinkedEntities(
    db: Connection | undefined,
    entityId: string
  ): Promise<IStatement[]> {
    const statements = await rethink
      .table(Entity.table)
      .getAll(entityId, { index: DbEnums.Indexes.StatementEntities })
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
   * finds statements that are using provided entityId in their
   * data.actants[].classifications or data.actants[].ident
   * @param db
   * @param entityId
   * @returns
   */
  static async findByDataActantsCI(
    db: Connection | undefined,
    entityId: string
  ): Promise<IStatement[]> {
    return await rethink
      .table(Entity.table)
      .getAll(entityId, { index: DbEnums.Indexes.StatementActantsCI })
      .run(db);
  }

  /**
   * reduces findByDataEntityId results to list of ids
   * @param db db connection
   * @param entityId id of the entity
   * @returns list of statements ids
   */
  static async getActantsIdsFromLinkedEntities(
    db: Connection | undefined,
    entityId: string
  ): Promise<string[]> {
    const statements = await Statement.getLinkedEntities(db, entityId);

    const entityIds: string[] = [];

    (statements as IStatement[]).forEach((s) => {
      const statement = new Statement(s);
      entityIds.push(...statement.getEntitiesIds());
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
    const statements: IStatement[] = await rethink
      .table(Entity.table)
      .getAll(entityId, { index: DbEnums.Indexes.StatementDataProps })
      .filter({
        class: EntityEnums.Class.Statement,
      })
      .run(db);

    // sort by order ASC
    return statements.sort((a, b) => {
      if (!a.data.territory) {
        return -1;
      }
      if (!b.data.territory) {
        return 0;
      }
      return a.data.territory.order - b.data.territory.order;
    });
  }

  static events: EventMapSingle = {
    [EventTypes.BEFORE_ENTITY_DELETE]: async (
      db: Connection,
      actantId: string
    ): Promise<void> => {
      const linkedToActant = await rethink
        .table(Entity.table)
        .filter({ class: EntityEnums.Class.Statement })
        .filter((row: any) => {
          return row("data")("actants").contains((actantElement: any) =>
            actantElement("entityId").eq(actantId)
          );
        })
        .run(db);

      for (const stData of linkedToActant) {
        const st = new Statement({ ...stData });
        await st.unlinkActantId(db, actantId);
      }

      const linkedToProps = await rethink
        .table(Entity.table)
        .filter({ class: EntityEnums.Class.Statement })
        .filter((row: any) => {
          return row("data")("props").contains((actantElement: any) =>
            actantElement("origin").eq(actantId)
          );
        })
        .run(db);

      const linkedToActions = await rethink
        .table(Entity.table)
        .filter({ class: EntityEnums.Class.Statement })
        .filter((row: any) => {
          return row("data")("actions").contains((actantElement: any) =>
            actantElement("actionId").eq(actantId)
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
