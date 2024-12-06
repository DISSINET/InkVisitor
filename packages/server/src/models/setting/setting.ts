import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IDbModel } from "@models/common";
import { ISetting, SettingsKey } from "@shared/types/settings";

export class Setting implements ISetting, IDbModel {
  id: string;
  value: unknown;
  public: boolean;

  static table = "settings";

  constructor(data: ISetting) {
    this.id = data.id;
    this.value = data.value;
    this.public = !!data.public;
  }

  isValid(): boolean {
    return !!this.id;
  }

  async save(dbInstance: Connection | undefined): Promise<boolean> {
    const result = await rethink
      .table(Setting.table)
      .insert({
        id: this.id,
        value: this.value,
        public: this.public,
      })
      .run(dbInstance);

    return result.inserted === 1;
  }

  update(
    dbInstance: Connection | undefined,
    updateData: { value: any }
  ): Promise<WriteResult> {
    return rethink
      .table(Setting.table)
      .get(this.id)
      .replace({ ...updateData, id: this.id, public: this.public })
      .run(dbInstance);
  }

  delete(dbInstance: Connection): Promise<WriteResult> {
    throw new Error("Setting cannot be removed");
  }

  static async getSetting(
    conn: Connection,
    key: SettingsKey
  ): Promise<Setting | null> {
    const result = await rethink.table(Setting.table).get(key).run(conn);
    return result ? new Setting(result as ISetting) : null;
  }

  static async getSettings(
    conn: Connection,
    keys: string[]
  ): Promise<Setting[]> {
    const results = await rethink.table(Setting.table).getAll.apply(undefined, keys).run(conn);
    return results.map(data => new Setting(data));
  }
}
