/**
 * The requests this browser has sent to the engine, kept in this browser.
 *
 * A production engine lists its requests only to a caller holding its admin
 * token, which a browser never holds, so the list the activity screen shows is
 * the one made here. It is what this browser asked, never what the engine
 * served to anyone else.
 */

const KEY = "geocoding-request-log";
const LIMIT = 50;

export interface RequestLogEntry {
  /** The engine's id for the request, once it has accepted it. */
  id: string | null;
  name: string;
  startedAt: number;
  durationMs: number;
  status: "finished" | "failed";
  /** How many suggestions came back, for a finished request. */
  suggestions?: number;
  error?: string;
}

export const readRequestLog = (): RequestLogEntry[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Newest first, the oldest dropped past the limit. */
export const recordRequest = (entry: RequestLogEntry): void => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([entry, ...readRequestLog()].slice(0, LIMIT)));
  } catch {
    /* a browser refusing site data cannot be made to keep this */
  }
};
