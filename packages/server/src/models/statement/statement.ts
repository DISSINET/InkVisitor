import {
  IStatement,
  IStatementData,
  IStatementActant,
  IStatementReference,
  IStatementAction,
} from "@shared/types";
import {
  fillFlatObject,
  fillArray,
  UnknownObject,
  IModel,
} from "@models/common";
import {
  ActantType,
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
} from "@shared/enums";

import Actant from "@models/actant/actant";
import { r as rethink, Connection, RDatum, WriteResult } from "rethinkdb-ts";
import { InternalServerError } from "@shared/types/errors";
import User from "@models/user/user";
import { EventMapSingle, EventTypes } from "@models/events/types";
import treeCache from "@service/treeCache";
import Prop from "@models/prop/prop";

export class StatementActant implements IStatementActant, IModel {
  id = "";
  actant = "";
  position: Position = Position.Subject;
  elvl: Elvl = Elvl.Textual;
  logic: Logic = Logic.Positive;
  virtuality: Virtuality = Virtuality.Reality;
  partitivity: Partitivity = Partitivity.Unison;
  operator: Operator = Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;
  props: Prop[] = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

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

export class StatementReference implements IStatementReference, IModel {
  id = "";
  resource = "";
  part = "";
  type = "";

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
    // Actant.determineOrder
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
  operator: Operator = Operator.And;
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
  territory = new StatementTerritory({});
  actions: StatementAction[] = [];
  actants: StatementActant[] = [];
  references: StatementReference[] = [];
  tags: string[] = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.territory = new StatementTerritory(data.territory as UnknownObject);
    fillArray<StatementAction>(this.actions, StatementAction, data.actions);
    fillArray<StatementActant>(this.actants, StatementActant, data.actants);
    fillArray<StatementReference>(
      this.references,
      StatementReference,
      data.references
    );

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
    if (!this.territory.isValid()) {
      return false;
    }
    if (this.actions.find((a) => !a.isValid())) {
      return false;
    }
    if (this.actants.find((a) => !a.isValid())) {
      return false;
    }
    if (this.references.find((r) => !r.isValid())) {
      return false;
    }

    return true;
  }
}

class Statement extends Actant implements IStatement {
  static table = "actants";
  static publicFields = Actant.publicFields;

  class: ActantType.Statement = ActantType.Statement;
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
    if (this.class != ActantType.Statement) {
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
    if (user.role === UserRole.Editor && this.data.territory.id === "T0") {
      return true;
    }

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

  canBeViewedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserRole.Admin) {
      return true;
    }

    return !!treeCache.getRightForTerritory(
      this.data.territory.id,
      user.rights
    );
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
    this.data.territory.order = Actant.determineOrder(
      this.data.territory.order,
      siblings
    );

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
    if (updateData["data"] && (updateData["data"] as any).territory) {
      const territoryData = (updateData["data"] as any).territory;
      if (territoryData.id) {
        this.data.territory.id = territoryData.id;
      }
      if (!this.data.territory.id) {
        throw new InternalServerError("territory id has to be set");
      }

      const wantedOrder = territoryData.order;

      const siblings = await this.findTerritorySiblings(db);
      this.data.territory.order = Actant.determineOrder(wantedOrder, siblings);
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
    const list: IStatement[] = await rethink
      .table(Actant.table)
      .filter({
        class: ActantType.Statement,
      })
      .filter((entry: RDatum) => {
        return rethink.and(
          entry("data")("territory")("id").eq(this.data.territory.id),
          entry("id").ne(this.id)
        );
      })
      .run(db);

    const out: Record<number, IStatement> = {};
    for (const ter of list) {
      out[ter.data.territory.order] = ter;
    }

    return out;
  }

  /**
   * Returns actant ids that are present in data fields
   * @returns list of ids
   */
  getEntitiesIds(): string[] {
    const actantsIds: Record<string, null> = {};

    this.data.actions.forEach((a) => {
      actantsIds[a.action] = null;
      if (a.props) {
        a.props.forEach((prop) => {
          actantsIds[prop.type.id] = null;
          actantsIds[prop.value.id] = null;

          if (prop.children) {
            prop.children.forEach((propChild) => {
              actantsIds[propChild.type.id] = null;
              actantsIds[propChild.value.id] = null;
            });
          }
        });
      }
    });

    this.data.actants.forEach((a) => {
      actantsIds[a.actant] = null;
      if (a.props) {
        a.props.forEach((prop) => {
          actantsIds[prop.type.id] = null;
          actantsIds[prop.value.id] = null;

          if (prop.children) {
            prop.children.forEach((propChild) => {
              actantsIds[propChild.type.id] = null;
              actantsIds[propChild.value.id] = null;
            });
          }
        });
      }
    });

    actantsIds[this.data.territory.id] = null;

    this.data.references.forEach((p) => {
      actantsIds[p.resource] = null;
    });

    this.data.tags.forEach((t) => (actantsIds[t] = null));

    return Object.keys(actantsIds);
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

  /**
   * getEntitiesIdsForMany wrapped in foreach cycle
   * @param statements list of scanned statements
   * @returns list of ids unique for multiple statements
   */
  static getEntitiesIdsForMany(statements: IStatement[]): string[] {
    const actantIds: Record<string, null> = {}; // unique check

    const stModel = new Statement(undefined);
    for (const statement of statements) {
      stModel.getEntitiesIds
        .call(statement)
        .forEach((id) => (actantIds[id] = null));
    }

    return Object.keys(actantIds);
  }

  /**
   * finds statements which are under specific territory
   * @param db db connection
   * @param territoryId id of the actant
   * @returns list of statements data
   */
  static async findStatementsInTerritory(
    db: Connection | undefined,
    territoryId: string
  ): Promise<IStatement[]> {
    const statements = await rethink
      .table("actants")
      .filter({
        class: ActantType.Statement,
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
   * finds statements which are linked to different actant
   * in other words, find statements which store passed actant id in on of their possible fields
   * @param db db connection
   * @param territoryId id of the actant
   * @returns list of statements data
   */
  static async findDependentStatements(
    db: Connection | undefined,
    actantId: string
  ): Promise<IStatement[]> {
    const statements = await rethink
      .table("actants")
      .filter({
        class: ActantType.Statement,
      })
      .filter((row: RDatum) => {
        return rethink.or(
          row("data")("territory")("id").eq(actantId),
          row("data")("actions").contains((entry: RDatum) =>
            entry("action").eq(actantId)
          ),
          row("data")("actants").contains((entry: RDatum) =>
            entry("actant").eq(actantId)
          ),
          row("data")("tags").contains(actantId),
          row("data")("props").contains((entry: RDatum) =>
            entry("value")("id").eq(actantId)
          ),
          row("data")("props").contains((entry: RDatum) =>
            entry("type")("id").eq(actantId)
          ),
          row("data")("props").contains((entry: RDatum) =>
            entry("origin").eq(actantId)
          ),
          row("data")("references").contains((entry: RDatum) =>
            entry("resource").eq(actantId)
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
      .table("actants")
      .filter({
        class: ActantType.Statement,
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
    [EventTypes.BEFORE_ACTANT_DELETE]: async (
      db: Connection,
      actantId: string
    ): Promise<void> => {
      const linkedToActant = await rethink
        .table(Actant.table)
        .filter({ class: ActantType.Statement })
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
        .table(Actant.table)
        .filter({ class: ActantType.Statement })
        .filter((row: any) => {
          return row("data")("props").contains((actantElement: any) =>
            actantElement("origin").eq(actantId)
          );
        })
        .run(db);

      const linkedToActions = await rethink
        .table(Actant.table)
        .filter({ class: ActantType.Statement })
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
