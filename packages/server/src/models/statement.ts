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
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
  }
}

class StatementReference implements IStatementReference {
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
}

class StatementTerritory {
  id = "";
  order = -1;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }
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
  territory = new StatementTerritory({});
  actants = [] as IStatementActant[];
  props = [] as IProp[];
  references = [] as IStatementReference[];
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
}

class Statement implements IStatement {
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
}

export default Statement;
