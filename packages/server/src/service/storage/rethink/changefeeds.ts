import { Connection, r } from "rethinkdb-ts";
import { ChangeHandlers } from "../types";
import { rethinkConfig } from "./conn";

/**
 * Background changefeed subscriber. Each feed runs in its own loop on its own
 * connection. On disconnect the handlers are told to drop what they cached
 * (events may have been missed) and the loop reconnects with exponential
 * backoff.
 */
const RECONNECT_INITIAL_MS = 1000;
const RECONNECT_MAX_MS = 30000;
// After this many consecutive failed connect/subscribe attempts, escalate the
// log to an alertable error so a permanently-wedged feed (which silently
// degrades freshness to the in-process cache only) is noticed rather than
// scrolling past as routine reconnects.
const ALERT_AFTER_FAILURES = 5;

async function runFeed(name: string, table: string, handlers: ChangeHandlers): Promise<void> {
  let backoff = RECONNECT_INITIAL_MS;
  let consecutiveFailures = 0;

  // Loop forever: each iteration is one connect+subscribe attempt.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let conn: Connection | null = null;
    try {
      conn = await r.connect({ ...rethinkConfig, timeout: 30 });
      handlers.onClear();

      const cursor = await r
        .table(table)
        .changes({ includeInitial: false, includeStates: false })
        .run(conn);

      console.log(`[changefeed:${name}] subscribed to ${table}`);
      backoff = RECONNECT_INITIAL_MS;
      consecutiveFailures = 0;

      for await (const change of cursor as AsyncIterable<{
        new_val?: { id?: string } | null;
        old_val?: { id?: string } | null;
      }>) {
        handlers.onChange(change.new_val ?? null, change.old_val ?? null);
      }

      console.log(`[changefeed:${name}] cursor ended; reconnecting`);
    } catch (err) {
      consecutiveFailures++;
      const detail = `[changefeed:${name}] error on attempt ${consecutiveFailures}; reconnecting in ${backoff}ms`;
      if (consecutiveFailures >= ALERT_AFTER_FAILURES) {
        // Sustained outage: this feed has been down long enough that
        // users/settings freshness now depends solely on in-process writes.
        console.error(
          `${detail} - feed DOWN for ${consecutiveFailures} consecutive attempts`,
          err
        );
      } else {
        console.error(detail, err);
      }
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

/** Fire-and-forget: a feed that cannot connect never blocks startup. */
export function watch(name: string, table: string, handlers: ChangeHandlers): void {
  runFeed(name, table, handlers).catch((err) => {
    console.error(`[changefeed:${name}] fatal`, err);
  });
}
