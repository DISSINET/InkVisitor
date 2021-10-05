import {
  IStatement,
  IStatementTerritory,
  IStatementActant,
  IStatementReference,
  IStatementProp,
} from "@shared/types";
import { fillFlatObject, fillArray, UnknownObject, IModel } from "./common";
import {
  ActantType,
  ActantStatus,
  EntityActantType,
  Certainty,
  Elvl,
  Position,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
  Operator,
} from "@shared/enums";

import Actant from "./actant";
import { r as rethink, Connection, RDatum, WriteResult } from "rethinkdb-ts";
import { InternalServerError } from "@shared/types/errors";

class StatementActant implements IStatementActant, IModel {
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

class StatementReference implements IStatementReference, IModel {
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

export class StatementTerritory implements IStatementTerritory {
  id = "";
  order = -1;
  actions = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }
    fillFlatObject(this, data);

    const action = { id: "", label: "", detail: "" };
    fillArray<typeof action>(
      this.actions,
      action.constructor as new (...data: any[]) => typeof action,
      data.actions
    );
  }

  /**
   * predicate for valid data content
   * @returns boolean result
   */
  isValid(): boolean {
    // order is optional, it will be fixed in underlaying call to Actant.determineOrder
    if (this.id === "") {
      return false;
    }

    return true;
  }
}

export class StatementAction {
  id = "";
  action: string = "";
  elvl: Elvl = Elvl.Textual;
  certainty: Certainty = Certainty.Certain;
  logic: Logic = Logic.Positive;
  mood: Mood[] = [];
  moodvariant: MoodVariant = MoodVariant.Realis;
  operator: Operator = Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;

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
    // order is optional, it will be moved to last position if empty
    if (this.id === "") {
      return false;
    }

    return true;
  }
}

export class StatementProp implements IStatementProp, IModel {
  id = "";

  origin = "";
  elvl: Elvl = Elvl.Textual;
  certainty: Certainty = Certainty.Certain;
  logic: Logic = Logic.Positive;
  mood: Mood[] = [];
  moodvariant: MoodVariant = MoodVariant.Realis;
  operator: Operator = Operator.And;
  bundleStart: boolean = false;
  bundleEnd: boolean = false;

  type: {
    id: string;
    elvl: Elvl;
    logic: Logic;
    virtuality: Virtuality;
    partitivity: Partitivity;
  } = {
    id: "",
    elvl: Elvl.Textual,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  };
  value: {
    id: string;
    elvl: Elvl;
    logic: Logic;
    virtuality: Virtuality;
    partitivity: Partitivity;
  } = {
    id: "",
    elvl: Elvl.Textual,
    logic: Logic.Positive,
    virtuality: Virtuality.Reality,
    partitivity: Partitivity.Unison,
  };

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);

    fillFlatObject(this.type, data.type as Record<string, unknown>);

    fillFlatObject(this.value, data.value as Record<string, unknown>);
  }

  isValid(): boolean {
    return true; // always true - no rules yet
  }
}

export class StatementData implements IModel {
  actions = [] as StatementAction[];
  text = "";
  territory = new StatementTerritory({});
  actants = [] as StatementActant[];
  props = [] as StatementProp[];
  references = [] as StatementReference[];
  tags = [] as string[];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);

    fillArray<StatementAction>(this.actions, StatementAction, data.actions);

    this.territory = new StatementTerritory(data.territory as UnknownObject);

    fillArray<StatementActant>(this.actants, StatementActant, data.actants);

    fillArray<StatementProp>(this.props, StatementProp, data.props);

    const refs = data.references; // to enable one-liner below (line lenth, formatter issue ^^)
    fillArray<StatementReference>(this.references, StatementReference, refs);

    // fill array uses constructors - which string[] cannot use (will create an object instead of string type)
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
    for (const actant of this.actants) {
      if (!actant.isValid()) {
        return false;
      }
    }
    for (const prop of this.props) {
      if (!prop.isValid()) {
        return false;
      }
    }
    for (const reference of this.references) {
      if (!reference.isValid()) {
        return false;
      }
    }

    return true;
  }
}

class Statement extends Actant implements IStatement {
  static table = "actants";

  id = "";
  class: ActantType.Statement = ActantType.Statement;
  data = new StatementData({});
  label = "";
  detail: string = "";
  status: ActantStatus = ActantStatus.Pending;
  language: string[] = ["eng"];
  notes: string[] = [];

  constructor(data: UnknownObject) {
    super();

    if (!data) {
      return;
    }

    fillFlatObject(this, data);
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

    return super.save(db);
  }

  /**
   * Updates the statement db entry. This method attempts to alter the territory.order value to better fit the real number value.
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

    return super.update(db, updateData);
  }

  /**
   * Finds statements that are stored under the same territory (while not being the same statement as the received)
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
  getLinkedActantIds(): string[] {
    const actantIds: Record<string, null> = {};

    this.data.actants.forEach((a) => (actantIds[a.actant] = null));
    this.data.tags.forEach((t) => (actantIds[t] = null));
    this.data.actions.forEach((t) => (actantIds[t.action] = null));
    this.data.props.forEach((p) => {
      actantIds[p.value.id] = null;
      actantIds[p.type.id] = null;
      actantIds[p.origin] = null;
    });
    this.data.references.forEach((p) => {
      actantIds[p.resource] = null;
    });
    actantIds[this.data.territory.id] = null;
    return Object.keys(actantIds);
  }

  /**
   * getLinkedActantIds wrapped in foreach cycle
   * @param statements list of scanned statements
   * @returns list of ids unique for multiple statements
   */
  static getLinkedActantIdsForMany(statements: IStatement[]): string[] {
    const actantIds: Record<string, null> = {}; // unique check

    const stModel = new Statement(undefined);
    for (const statement of statements) {
      stModel.getLinkedActantIds
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
   * finds statements which are under specific territory
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
   * finds statements that are linked via data.actants array to wanted actant id and are linked to the root territory
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
}

export default Statement;
