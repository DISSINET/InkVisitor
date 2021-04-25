import { fillFlatObject, UnknownObject, IModel, IDbModel } from "./common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { ActantType, EntityActantType } from "@shared/enums";
import { IEntity, entityLogicalTypeValues } from "@shared/types/entity";

class EntityData implements IModel {
  logicalType: typeof entityLogicalTypeValues[number] = "s";

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }
  }

  isValid(): boolean {
    return true;
  }
}

class Entity implements IEntity, IDbModel {
  static table = "actants";

  id = "";
  class: EntityActantType = ActantType.Concept; // just default
  label = "";
  data = new EntityData({});

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
    this.data = new EntityData(data.data as UnknownObject);
  }

  isValid(): boolean {
    const alloweedClasses = [
      ActantType.Person,
      ActantType.Group,
      ActantType.Object,
      ActantType.Concept,
      ActantType.Location,
      ActantType.Value,
      ActantType.Event,
    ];
    if (alloweedClasses.indexOf(this.class) === -1) {
      return false;
    }

    return this.data.isValid();
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(Entity.table)
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
    return rethink.table(Entity.table).get(this.id).update(updateData).run(db);
  }

  delete(db: Connection | undefined): Promise<WriteResult> {
    return rethink.table(Entity.table).get(this.id).delete().run(db);
  }
}

export default Entity;
