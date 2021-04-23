import { ActantType } from "@shared/enums";
import { ITerritory, IParentTerritory } from "@shared/types/territory";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { fillFlatObject, UnknownObject, IModel, IDbModel } from "./common";

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

class Territory implements ITerritory, IDbModel {
  static table = "actants";

  id = "";
  class: ActantType.Territory = ActantType.Territory;
  label = "";
  data = new TerritoryData({});

  constructor(data: UnknownObject) {
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

  async findChilds(
    db: Connection | undefined,
    parentId: string
  ): Promise<ITerritory[]> {
    return await rethink
      .table(Territory.table)
      .filter(function (territory: any) {
        return rethink.and(
          territory("data")("parent").typeOf().eq("OBJECT"),
          territory("data")("parent")("id").eq(parentId)
        );
      })
      .run(db);
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    if (this.data.parent) {
      const childs = await this.findChilds(db, this.data.parent.id);
      this.data.parent.order = childs.length + 1;
    }
    return rethink.table(Territory.table).insert(this).run(db);
  }

  update(
    db: Connection | undefined,
    updateData: Record<string, undefined>
  ): Promise<WriteResult> {
    return rethink
      .table(Territory.table)
      .get(this.id)
      .update(updateData)
      .run(db);
  }

  delete(db: Connection | undefined): Promise<WriteResult> {
    return rethink.table(Territory.table).get(this.id).delete().run(db);
  }
}

export default Territory;
