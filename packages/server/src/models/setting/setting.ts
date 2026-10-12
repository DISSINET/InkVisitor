import { Conn, WriteResult, storage } from "@service/storage";
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

  async save(dbInstance: Conn | undefined): Promise<boolean> {
    const result = await storage.settings.insert(
      dbInstance as Conn,
      {
        id: this.id,
        value: this.value,
        public: this.public,
      },
      { conflict: "update" } // use upsert
    );

    cache.delete(SETTINGS_ALL_CACHE_KEY);
    return result.inserted === 1;
  }

  async update(
    dbInstance: Conn | undefined,
    updateData: { value: any }
  ): Promise<WriteResult> {
    const result = await storage.settings.replace(dbInstance as Conn, this.id, {
      ...updateData,
      id: this.id,
      public: this.public,
    });

    cache.delete(SETTINGS_ALL_CACHE_KEY);
    return result;
  }

  delete(dbInstance: Conn): Promise<WriteResult> {
    throw new Error("Setting cannot be removed");
  }

  static async getSetting(
    conn: Conn,
    key: SettingsKey
  ): Promise<Setting | null> {
    const result = await storage.settings.get(conn, key);
    return result ? new Setting(result) : null;
  }

  static async getSettings(
    conn: Conn,
    keys: string[]
  ): Promise<Setting[]> {
    const results = await storage.settings.getMany(conn, keys);
    return results.map((data) => new Setting(data));
  }

  /**
   * Returns the full settings list. Consumers only ever read .id and
   * .value, so this returns plain ISetting[] - no Setting wrappers - to
   * avoid allocating N instances per call on the hot path. The cache
   * deep-clones on read, so callers may not mutate the result.
   */
  static async getSettingsAll(conn: Conn): Promise<ISetting[]> {
    // Snapshot before the DB read; trySet below refuses if a writer
    // invalidated the key meanwhile.
    const version = cache.snapshot(SETTINGS_ALL_CACHE_KEY);
    const cached = cache.get<ISetting[]>(SETTINGS_ALL_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const results = await storage.settings.all(conn);
    cache.trySet(SETTINGS_ALL_CACHE_KEY, results, undefined, version);
    return results;
  }

  static async updateGroup(
    conn: Conn,
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
