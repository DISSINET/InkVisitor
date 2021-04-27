import { ActantType } from "@shared/enums";
import { ITerritory, IParentTerritory } from "@shared/types/territory";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { fillFlatObject, UnknownObject, IModel } from "./common";
import Actant from "./actant";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";

export class TerritoryParent implements IParentTerritory, IModel {
  id = "";
  order = -1;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data as Record<string, unknown>);
  }

  isValid(): boolean {
    if (this.id === "" || this.order === -1) {
      return false;
    }

    return true;
  }
}

export class TerritoryData implements IModel {
  parent: TerritoryParent | false = false;
  type = "";
  content = "";
  lang = "";

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    const parentData = data.parent;
    delete data.parent;
    fillFlatObject(this, data);
    if (parentData) {
      this.parent = new TerritoryParent(parentData as Record<string, unknown>);
    }
  }

  isValid(): boolean {
    if (this.parent) {
      return this.parent.isValid();
    }

    return true;
  }
}

class Territory extends Actant implements ITerritory {
  static table = "actants";

  id = "";
  class: ActantType.Territory = ActantType.Territory;
  label = "";
  data = new TerritoryData({});

  constructor(data: UnknownObject) {
    super();

    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.data = new TerritoryData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== ActantType.Territory) {
      return false;
    }

    return this.data.isValid();
  }

  async findChilds(db: Connection | undefined): Promise<ITerritory[]> {
    return await rethink
      .table(Territory.table)
      .filter((territory: any) => {
        return rethink.and(
          territory("data")("parent").typeOf().eq("OBJECT"),
          territory("data")("parent")("id").eq(this.id)
        );
      })
      .run(db);
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    if (this.data.parent) {
      // get count of future siblings and move current territory to last position
      const childs = await this.findChilds.call(
        new Territory({ id: this.data.parent.id }),
        db
      );
      this.data.parent.order = childs.length + 1;
    }

    const result = await rethink
      .table(Territory.table)
      .insert({ ...this, id: undefined })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result;
  }

  async delete(db: Connection | undefined): Promise<WriteResult> {
    if (!this.id) {
      throw new Error("delete called on territory with undefined id");
    }

    const childs = await this.findChilds(db);
    if (childs.length) {
      throw new Error("cannot delete territory with childs");
    }

    return await super.delete(db);
  }
}

export default Territory;
