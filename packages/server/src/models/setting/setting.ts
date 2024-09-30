import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IDbModel } from "@models/common";
import { ISetting, SettingsKey } from "@shared/types/settings";

export class Setting implements ISetting, IDbModel {
  id: SettingsKey;
  value: unknown;

  static table = "settings";

  constructor(data: ISetting) {
    this.id = data.id;
    this.value = data.value;
  }

  isValid(): boolean {
    return Object.values(SettingsKey).includes(this.id);
  }

  async save(dbInstance: Connection | undefined): Promise<boolean> {
    const result = await rethink
      .table(Setting.table)
      .insert({
        id: this.id,
        value: this.value,
      })
      .run(dbInstance);

    return result.inserted === 1;
  }

  update(
    dbInstance: Connection | undefined,
    updateData: { value: unknown }
  ): Promise<WriteResult> {
    return rethink
      .table(Setting.table)
      .get(this.id)
      .update(updateData)
      .run(dbInstance);
  }

  delete(dbInstance: Connection): Promise<WriteResult> {
    throw new Error("Setting cannot be removed");
  }
}
