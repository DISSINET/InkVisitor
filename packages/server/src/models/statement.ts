import {
  IStatement,
  IStatementActant,
  IStatementReference,
} from "@shared/types/statement";
import { fillFlatObject, fillArray, UnknownObject, IModel } from "./common";
import { Prop } from "./prop";
import { ActantType } from "@shared/enums";
import Actant from "./actant";
import { r as rethink, Connection, RDatum, WriteResult } from "rethinkdb-ts";
import { InternalServerError } from "@shared/types/errors";

class StatementActant implements IStatementActant, IModel {
  id = "";
  actant = "";
  position = "";
  modality = "";
  elvl = "";
  certainty = "";

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return false;
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

  isValid(): boolean {
    return false;
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

  isValid(): boolean {
    // order is optional, it will be moved to last position if empty
    if (this.id === "") {
      return false;
    }

    return true;
  }
}

export class StatementData implements IModel {
  action = "";
  certainty = "";
  elvl = "";
  modality = "";
  text = "";
  note = "";
  territory = new StatementTerritory({});
  actants = [] as StatementActant[];
  props = [] as Prop[];
  references = [] as StatementReference[];
  tags = [] as string[];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.territory = new StatementTerritory(data.territory as UnknownObject);

    fillArray<StatementActant>(this.actants, StatementActant, data.actants);

    fillArray<Prop>(this.props, Prop, data.props);

    const refs = data.references; // to enable one-liner below (line lenth, formatter issue ^^)
    fillArray<StatementReference>(this.references, StatementReference, refs);

    // fill array uses constructors - which string[] cannot use (will create an object instead of string type)
    if (data.tags) {
      for (const tag of data.tags as string[]) {
        this.tags.push(tag);
      }
    }
  }

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
  label = "";
  data = new StatementData({});

  constructor(data: UnknownObject) {
    super();

    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.data = new StatementData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class != ActantType.Statement) {
      return false;
    }

    return this.data.isValid();
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    const siblings = await this.findTerritorySiblings(db);
    this.data.territory.order = Actant.determineOrder(
      this.data.territory.order,
      siblings
    );

    return super.save(db);
  }

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

  async findTerritorySiblings(
    db: Connection | undefined
  ): Promise<Record<number, IStatement>> {
    const list: IStatement[] = await rethink
      .table(Actant.table)
      .filter((territory: RDatum) => {
        return rethink.and(
          territory("data")("territory")("id").eq(this.data.territory.id),
          territory("id").ne(this.id)
        );
      })
      .run(db);

    const out: Record<number, IStatement> = {};
    for (const ter of list) {
      out[ter.data.territory.order] = ter;
    }

    return out;
  }

  getDependencyList(): string[] {
    const actantIds: Record<string, null> = {};

    this.data.actants.forEach((a) => (actantIds[a.actant] = null));
    this.data.tags.forEach((t) => (actantIds[t] = null));
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

  static getDependencyListForMany(statements: IStatement[]): string[] {
    const actantIds: Record<string, null> = {}; // unique check

    const stModel = new Statement(undefined);
    for (const statement of statements) {
      stModel.getDependencyList
        .call(statement)
        .forEach((id) => (actantIds[id] = null));
    }

    return Object.keys(actantIds);
  }

  static async findDependentStatementIds(
    db: Connection | undefined,
    actantId: string
  ): Promise<string[]> {
    const statements = await rethink
      .table("actants")
      .filter({
        class: ActantType.Statement,
      })
      .filter((row: RDatum) => {
        return rethink.or(
          row("data")("territory")("id").eq(actantId),
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
      .pluck("id")
      .run(db);

    return statements.map((s) => s.id);
  }
}

export default Statement;
