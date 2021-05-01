import {
  IStatement,
  IStatementActant,
  IStatementReference,
} from "@shared/types/statement";
import { fillFlatObject, fillArray, UnknownObject, IModel } from "./common";
import { Prop } from "./prop";
import { ActantType } from "@shared/enums";
import Actant from "./actant";
import { r as rethink, Connection, RDatum } from "rethinkdb-ts";

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

    const refs = data.references; // to enable oneline below (formatter issue ^^)
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
      .filter((user: any) => {
        return rethink.or(
          user("data")("tags").contains(actantId),
          user("data")("actants").contains((entry: RDatum) =>
            entry("actant").eq(actantId)
          ),
          user("data")("tags").contains(actantId),
          user("data")("props").contains((entry: RDatum) =>
            entry("value")("id").eq(actantId)
          ),
          user("data")("props").contains((entry: RDatum) =>
            entry("type")("id").eq(actantId)
          ),
          user("data")("props").contains((entry: RDatum) =>
            entry("origin").eq(actantId)
          ),
          user("data")("references").contains((entry: RDatum) =>
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
