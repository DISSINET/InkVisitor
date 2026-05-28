import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IDbModel } from "@models/common";
import { ISetting, SettingsKey } from "@inkvisitor/shared/types/settings";
import { cache } from "@service/ttlCache";

// No TTL: invalidation is fully owned by the changefeed listener in
// service/changefeedInvalidator.ts plus the explicit cache.delete calls
// in save/update below.
export const SETTINGS_ALL_CACHE_KEY = "settings:all";

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
      .insert(
        {
          id: this.id,
          value: this.value,
          public: this.public,
        },
        { conflict: "update" } // use upsert
      )
      .run(dbInstance);

    cache.delete(SETTINGS_ALL_CACHE_KEY);
    return result.inserted === 1;
  }

  async update(
    dbInstance: Connection | undefined,
    updateData: { value: any }
  ): Promise<WriteResult> {
    const result = await rethink
      .table(Setting.table)
      .get(this.id)
      .replace({ ...updateData, id: this.id, public: this.public })
      .run(dbInstance);

    cache.delete(SETTINGS_ALL_CACHE_KEY);
    return result;
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
    const results = await rethink
      .table(Setting.table)
      .getAll.apply(undefined, keys)
      .run(conn);
    return results.map((data) => new Setting(data));
  }

  static async getSettingsAll(conn: Connection): Promise<Setting[]> {
    const cached = cache.get<ISetting[]>(SETTINGS_ALL_CACHE_KEY);
    if (cached) {
      return cached.map((data) => new Setting(data));
    }

    const results = await rethink.table(Setting.table).run(conn);
    cache.set(SETTINGS_ALL_CACHE_KEY, results as ISetting[]);
    return results.map((data) => new Setting(data));
  }

  static async updateGroup(
    conn: Connection,
    allowedSettingsKeys: string[],
    data: { id: string; value: unknown }[]
  ): Promise<boolean> {
    for (const entry of data) {
      if (allowedSettingsKeys.includes(entry.id)) {
        await new Setting({
          id: entry.id,
          value: entry.value,
          public: false,
        }).save(conn);
      }
    }
    return true;
  }
}
