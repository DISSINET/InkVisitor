import { fillFlatObject, UnknownObject, IModel, IDbModel } from "./common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { ActantType } from "@shared/enums";
import { IResource, languageValues } from "@shared/types/resource";

class ResourceData implements IModel {
  content = "";
  link = "";
  type = "";
  lang: typeof languageValues[number] = "en"; // default

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Resource implements IResource, IDbModel {
  static table = "actants";

  id = "";
  class: ActantType.Resource = ActantType.Resource;
  label = "";
  data = new ResourceData({});

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.data = new ResourceData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== ActantType.Resource) {
      return false;
    }

    return this.data.isValid();
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(Resource.table)
      .insert({ ...this, id: undefined })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result;
  }

  update(
    db: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    return rethink
      .table(Resource.table)
      .get(this.id)
      .update(updateData)
      .run(db);
  }

  delete(db: Connection | undefined): Promise<WriteResult> {
    return rethink.table(Resource.table).get(this.id).delete().run(db);
  }
}

export default Resource;
