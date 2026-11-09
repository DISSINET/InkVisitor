import { cache } from "./ttlCache";
import { ChangeHandlers, storage } from "@service/storage";
import User, { USER_CACHE_KEY_PREFIX, userCacheKey } from "@models/user/user";
import { Setting, SETTINGS_ALL_CACHE_KEY } from "@models/setting/setting";
import { clearQueryBaseCache } from "./query/query-base-cache";
import { TABLE } from "./storage/names";

/**
 * Background change subscribers that invalidate the in-memory TtlCache and the
 * explore query results whenever a row is written by anyone - this process,
 * another replica, or an out-of-band script. The TTLs on the cached tables are
 * deliberately long (24h, 5 minutes for query results) and rely on these
 * listeners for freshness; if a feed is offline we are temporarily back to
 * that staleness ceiling.
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
  // any entity or relation may change the result of any cached query
  ...[TABLE.entities, TABLE.relations].map((table) => ({
    name: `query-results:${table}`,
    table,
    onClear: clearQueryBaseCache,
    onChange: clearQueryBaseCache,
  })),
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
