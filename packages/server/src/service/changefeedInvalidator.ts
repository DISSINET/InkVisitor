import { Connection, r } from "rethinkdb-ts";
import { cache } from "./ttlCache";
import { rethinkConfig } from "./rethink";
import User, { USER_CACHE_KEY_PREFIX, userCacheKey } from "@models/user/user";
import { Setting, SETTINGS_ALL_CACHE_KEY } from "@models/setting/setting";

/**
 * Background changefeed subscribers that invalidate the in-memory TtlCache
 * whenever a row is written by anyone - this process, another replica, or an
 * out-of-band script. The TTLs on the cached tables are deliberately long
 * (24h) and rely on these listeners for freshness; if a feed is offline we
 * are temporarily back to a 24h staleness ceiling.
 *
 * Each feed runs in its own loop on its own connection. On disconnect we
 * drop the cache subset that feed owns (we don't know what we missed) and
 * reconnect with exponential backoff.
 */

const RECONNECT_INITIAL_MS = 1000;
const RECONNECT_MAX_MS = 30000;

interface Feed {
  name: string;
  table: string;
  onClear: () => void;
  onChange: (newVal: { id?: string } | null, oldVal: { id?: string } | null) => void;
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

async function runFeed(feed: Feed): Promise<void> {
  let backoff = RECONNECT_INITIAL_MS;

  // Loop forever: each iteration is one connect+subscribe attempt.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let conn: Connection | null = null;
    try {
      conn = await r.connect({ ...rethinkConfig, timeout: 30 });
      // On (re)connect, drop the keys this feed owns - we don't know what
      // events happened while we were disconnected.
      feed.onClear();

      const cursor = await r
        .table(feed.table)
        .changes({ includeInitial: false, includeStates: false })
        .run(conn);

      console.log(`[changefeed:${feed.name}] subscribed to ${feed.table}`);
      backoff = RECONNECT_INITIAL_MS;

      for await (const change of cursor as AsyncIterable<{
        new_val?: { id?: string } | null;
        old_val?: { id?: string } | null;
      }>) {
        feed.onChange(change.new_val ?? null, change.old_val ?? null);
      }

      console.log(`[changefeed:${feed.name}] cursor ended; reconnecting`);
    } catch (err) {
      console.error(
        `[changefeed:${feed.name}] error; reconnecting in ${backoff}ms`,
        err
      );
    } finally {
      if (conn) {
        try {
          await conn.close({ noreplyWait: false });
        } catch {
          // ignore close errors during teardown
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, backoff));
    backoff = Math.min(backoff * 2, RECONNECT_MAX_MS);
  }
}

/**
 * Boot fire-and-forget changefeed loops. Does not block startup - if a feed
 * cannot connect, the server still serves traffic (with the in-mutator
 * cache.delete still firing for in-process writes).
 */
export function startCacheInvalidators(): void {
  for (const feed of feeds) {
    runFeed(feed).catch((err) => {
      console.error(`[changefeed:${feed.name}] fatal`, err);
    });
  }
}
