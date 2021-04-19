import {
  IStatement,
  IStatementActant,
  IStatementReference,
} from "@shared/types/statement";
import { fillFlatObject, fillArray, UnknownObject, IModel } from "./common";
import { Prop } from "./prop";

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
    if (this.id === "" || this.order === -1) {
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

    fillArray(this.tags, String, data.tags);
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

class Statement implements IStatement, IModel {
  id = "";
  class: "S" = "S";
  label = "";
  data = new StatementData({});

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.data = new StatementData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class != "S") {
      return false;
    }

    return this.data.isValid();
  }
}

export default Statement;
