import { cache } from "./ttlCache";
import { ChangeHandlers, storage } from "@service/storage";
import User, { USER_CACHE_KEY_PREFIX, userCacheKey } from "@models/user/user";
import { Setting, SETTINGS_ALL_CACHE_KEY } from "@models/setting/setting";

/**
 * Background change subscribers that invalidate the in-memory TtlCache
 * whenever a row is written by anyone - this process, another replica, or an
 * out-of-band script. The TTLs on the cached tables are deliberately long
 * (24h) and rely on these listeners for freshness; if a feed is offline we
 * are temporarily back to a 24h staleness ceiling.
 *
 * The storage adapter owns the subscription itself (connection, reconnect
 * with backoff); this module only says which tables to follow and which cache
 * keys each one owns.
 */

interface Feed extends ChangeHandlers {
  name: string;
  table: string;
}

const feeds: Feed[] = [
  {
    name: "users",
    table: User.table,
    onClear: () => cache.deletePrefix(USER_CACHE_KEY_PREFIX),
    onChange: (newVal, oldVal) => {
      const id = newVal?.id ?? oldVal?.id;
      if (id) cache.delete(userCacheKey(id));
    },
  },
  {
    name: "settings",
    table: Setting.table,
    onClear: () => cache.delete(SETTINGS_ALL_CACHE_KEY),
    onChange: () => cache.delete(SETTINGS_ALL_CACHE_KEY),
  },
];

/**
 * Boot fire-and-forget change loops. Does not block startup - if a feed
 * cannot connect, the server still serves traffic (with the in-mutator
 * cache.delete still firing for in-process writes).
 */
export function startCacheInvalidators(): void {
  for (const feed of feeds) {
    storage.watch(feed.name, feed.table, feed);
  }
}
