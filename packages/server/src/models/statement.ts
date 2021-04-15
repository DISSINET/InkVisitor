import {
  IStatement,
  IStatementActant,
  IStatementReference,
} from "@shared/types/statement";
import { IProp } from "@shared/types";
import { fillFlatObject } from "./common";
import { Prop } from "./prop";

class StatementActant implements IStatementActant {
  id = "";
  actant = "";
  position = "";
  modality = "";
  elvl = "";
  certainty = "";

  constructor(data: Record<string, unknown>) {
    fillFlatObject(this, data);
  }
}

class StatementReference implements IStatementReference {
  id = "";
  resource = "";
  part = "";
  type = "";

  constructor(data: Record<string, unknown>) {
    fillFlatObject(this, data);
  }
}

class Statement implements IStatement {
  id = "";
  class: "S" = "S";
  label = "";
  data = {
    action: "",
    certainty: "",
    elvl: "",
    modality: "",
    text: "",
    note: "",
    territory: {
      id: "",
      order: -1,
    },
    actants: [] as IStatementActant[],
    props: [] as IProp[],
    references: [] as IStatementReference[],
    tags: [] as string[],
  };

  constructor(data: Record<string, unknown>) {
    fillFlatObject(this, data);

    if (typeof data.data === "object" && data.data !== null) {
      const passedData = data.data as Record<string, unknown>;
      fillFlatObject(this.data, passedData);

      if (
        typeof passedData.territory === "object" &&
        passedData.territory !== null
      ) {
        const territoryData = passedData.territory as Record<string, unknown>;
        fillFlatObject(this.data.territory, territoryData);
      }

      if (
        typeof passedData.actants === "object" &&
        (passedData.actants as []).length
      ) {
        for (const actant of passedData.actants as []) {
          this.data.actants.push(new StatementActant(actant));
        }
      }

      if (
        typeof passedData.props === "object" &&
        (passedData.props as []).length
      ) {
        for (const prop of passedData.props as []) {
          this.data.props.push(new Prop(prop));
        }
      }

      if (
        typeof passedData.references === "object" &&
        (passedData.references as []).length
      ) {
        for (const reference of passedData.references as []) {
          this.data.references.push(new StatementReference(reference));
        }
      }

      if (
        typeof passedData.tags === "object" &&
        (passedData.tags as []).length
      ) {
        for (const tag of passedData.tags as []) {
          this.data.tags.push(tag);
        }
      }
    }
  }
}

export default Statement;
