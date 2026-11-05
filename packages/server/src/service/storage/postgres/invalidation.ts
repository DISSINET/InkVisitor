import { Client, Notification } from "pg";
import { ChangeHandlers } from "../types";
import { pgConfig } from "./conn";
import { CHANGES_CHANNEL, NOTIFY_TABLES } from "./provision";

/**
 * The PostgreSQL changefeed: one dedicated Client, outside the pool, LISTENs
 * on CHANGES_CHANNEL, which the triggers of NOTIFY_TABLES notify on after
 * every committed write from any session. A notification arrives after the
 * commit, so the models still drop their own cache keys when they write. On a
 * lost connection the loop reconnects with exponential backoff and calls every
 * onClear once LISTEN is back, since notifications sent meanwhile are gone.
 */
const RECONNECT_INITIAL_MS = 1000;
const RECONNECT_MAX_MS = 30000;
// After this many consecutive failed attempts the log says the feed is down,
// so a wedged listener is noticed rather than scrolling past as a reconnect.
const ALERT_AFTER_FAILURES = 5;
/** application_name of the listener's session in pg_stat_activity */
export const LISTENER_NAME = "inkvisitor-changefeed";

const watchers = new Map<string, ChangeHandlers[]>();

interface Listener {
  stopped: boolean;
  client: Client | null;
  wake: (() => void) | null;
  done: Promise<void>;
}
let listener: Listener | null = null;

export function watch(name: string, table: string, handlers: ChangeHandlers): void {
  if (!NOTIFY_TABLES.includes(table)) {
    console.warn(`[changefeed:${name}] postgres: ${table} has no change trigger, its writes are not followed`);
    return;
  }
  watchers.set(table, [...(watchers.get(table) ?? []), handlers]);
  if (!listener) {
    const l: Listener = { stopped: false, client: null, wake: null, done: Promise.resolve() };
    l.done = listen(l).catch((err) => console.error("[changefeed] postgres: fatal", err));
    listener = l;
  }
}

function dispatch({ payload }: Notification): void {
  if (!payload) return;
  const at = payload.indexOf(":");
  const table = at < 0 ? payload : payload.slice(0, at);
  const id = payload.slice(at + 1);
  for (const handlers of watchers.get(table) ?? []) {
    if (at < 0) handlers.onClear();
    else handlers.onChange({ id }, { id });
  }
}

async function listen(l: Listener): Promise<void> {
  let backoff = RECONNECT_INITIAL_MS;
  let failures = 0;
  while (!l.stopped) {
    const client = new Client({
      ...pgConfig,
      application_name: LISTENER_NAME,
      connectionTimeoutMillis: 30000,
      // a peer that vanished without closing the socket is noticed within
      // minutes; the OS default waits two hours before the first probe
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });
    // an 'error' event without a listener would crash the process
    const lost = new Promise<Error | undefined>((resolve) => {
      client.on("error", resolve);
      client.on("end", () => resolve(undefined));
    });
    client.on("notification", (notification) => {
      try {
        dispatch(notification);
      } catch (err) {
        console.error("[changefeed] postgres: handler failed", err);
      }
    });
    try {
      await client.connect();
      await client.query(`LISTEN ${CHANGES_CHANNEL}`);
      if (l.stopped) break;
      l.client = client;
      for (const list of watchers.values()) list.forEach((handlers) => handlers.onClear());
      console.log(`[changefeed] postgres: listening on ${CHANGES_CHANNEL} for ${[...watchers.keys()].join(", ")}`);
      backoff = RECONNECT_INITIAL_MS;
      failures = 0;
      const err = await lost;
      if (l.stopped) break;
      if (err) throw err;
      console.log("[changefeed] postgres: connection ended; reconnecting");
    } catch (err) {
      if (l.stopped) break;
      failures++;
      const detail = `[changefeed] postgres: error on attempt ${failures}; reconnecting in ${backoff}ms`;
      if (failures >= ALERT_AFTER_FAILURES) {
        console.error(`${detail} - feed DOWN for ${failures} consecutive attempts`, err);
      } else {
        console.error(detail, err);
      }
    } finally {
      l.client = null;
      // not awaited: an end() that never settles must not stop the loop
      client.end().catch(() => undefined);
    }
    if (l.stopped) break;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, backoff);
      l.wake = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    l.wake = null;
    backoff = Math.min(backoff * 2, RECONNECT_MAX_MS);
  }
}

/** drops every handler and closes the listener; a later watch starts a new one */
export async function resetWatchers(): Promise<void> {
  watchers.clear();
  const l = listener;
  listener = null;
  if (!l) return;
  l.stopped = true;
  l.wake?.();
  await l.client?.end().catch(() => undefined);
  await l.done;
}
