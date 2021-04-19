import {
  IStatement,
  IStatementActant,
  IStatementReference,
} from "@shared/types/statement";
import { IProp } from "@shared/types";
import { fillFlatObject, fillArray, UnknownObject } from "./common";
import { Prop } from "./prop";

class StatementActant implements IStatementActant {
  id = "";
  actant = "";
  position = "";
  modality = "";
  elvl = "";
  certainty = "";

  constructor(data: UnknownObject) {
    fillFlatObject(this, data);
  }
}

class StatementReference implements IStatementReference {
  id = "";
  resource = "";
  part = "";
  type = "";

  constructor(data: UnknownObject) {
    fillFlatObject(this, data);
  }
}

class StatementTerritoryData {
  id = "";
  order = -1;

  constructor(data: UnknownObject) {
    fillFlatObject(this, data);
  }
}

class StatementData {
  action = "";
  certainty = "";
  elvl = "";
  modality = "";
  text = "";
  note = "";
  territory = new StatementTerritoryData({});
  actants = [] as IStatementActant[];
  props = [] as IProp[];
  references = [] as IStatementReference[];
  tags = [] as string[];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.territory = new StatementTerritoryData(
      data.territory as UnknownObject
    );

    fillArray<StatementActant>(
      this.actants,
      StatementActant,
      data ? (data.actants as unknown[]) : null
    );

    fillArray<Prop>(this.props, Prop, data ? (data.props as unknown[]) : null);

    fillArray<StatementReference>(
      this.references,
      StatementReference,
      data ? (data.references as unknown[]) : null
    );

    fillArray(this.tags, String, data ? (data.tags as unknown[]) : null);
  }
}

class Statement implements IStatement {
  id = "";
  class: "S" = "S";
  label = "";
  data = new StatementData({});

  constructor(data: UnknownObject) {
    fillFlatObject(this, data);
    this.data = new StatementData(data.data as UnknownObject);
  }
}

export default Statement;
