import { ChangeHandlers } from "../types";

/**
 * The in-process stand-in for RethinkDB changefeeds. Handlers register per
 * table and the generic store calls them right after a write on that table
 * succeeds. Writes from another process are invisible here; the epic assumes
 * a single API instance.
 */
const watchers = new Map<string, ChangeHandlers[]>();

export function watch(name: string, table: string, handlers: ChangeHandlers): void {
  const list = watchers.get(table) ?? [];
  list.push(handlers);
  watchers.set(table, list);
  console.log(`[changefeed:${name}] postgres: in-process invalidation on ${table}`);
}

export type ChangeKind = "insert" | "update" | "delete";

/** tells every watcher of `table` which rows a write touched */
export function notifyChanged(table: string, ids: string[], kind: ChangeKind): void {
  const list = watchers.get(table);
  if (!list || !ids.length) {
    return;
  }
  for (const handlers of list) {
    for (const id of ids) {
      handlers.onChange(kind === "delete" ? null : { id }, kind === "insert" ? null : { id });
    }
  }
}

export function notifyCleared(table: string): void {
  for (const handlers of watchers.get(table) ?? []) {
    handlers.onClear();
  }
}

/** test helper */
export function resetWatchers(): void {
  watchers.clear();
}
