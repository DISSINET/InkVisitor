/**
 * The places this browser has just been given a coordinate, newest first.
 *
 * Kept in the browser and nowhere else, for the same reason the map's switches
 * are: it is a memory of what this researcher did a minute ago, not a statement
 * about the data, and nothing about it is worth a write to the server per
 * accepted suggestion. The record of what was written, by whom, is on the
 * Location itself.
 */
import type { Suggestion } from "../../types/engine";

export interface RecentGeocode {
  /** The Location's entity id. A Location appears once, at its latest write. */
  id: string;
  label: string;
  /** The point the entry flies to: the geometry itself, or its anchor. */
  lat: number;
  lon: number;
  /** The GeoJSON type that was written, so the entry can say what it holds. */
  kind: string;
  accuracy: string;
  /**
   * What the engine said about the place that was taken, so the card that was
   * read when choosing can be read again. Absent where the coordinate was drawn
   * or typed rather than taken from a suggestion.
   */
  suggestion?: Suggestion;
  /** When it was written, in milliseconds since the epoch. */
  at: number;
}

export const RECENT_KEY = "geocoding:recent";

/** Enough to cover a working session's last stretch without becoming a log. */
export const RECENT_LIMIT = 12;

/**
 * Puts an entry at the head of the list.
 *
 * A Location written twice appears once: the earlier entry would name a
 * coordinate it no longer has, and the list is for finding where things are now.
 */
export const addRecent = (list: RecentGeocode[], entry: RecentGeocode): RecentGeocode[] =>
  [entry, ...list.filter((one) => one.id !== entry.id)].slice(0, RECENT_LIMIT);

const isEntry = (value: unknown): value is RecentGeocode => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.label === "string" &&
    typeof entry.lat === "number" &&
    Number.isFinite(entry.lat) &&
    typeof entry.lon === "number" &&
    Number.isFinite(entry.lon) &&
    typeof entry.kind === "string" &&
    typeof entry.accuracy === "string" &&
    typeof entry.at === "number"
  );
};

const SIGNAL_FIELDS = [
  "agreement",
  "evidence",
  "contextGate",
  "candidatePrior",
  "offRegionFactor",
  "convergence",
  "matchScore",
  "candidateDiversity",
];

// only what the card reads: a stored shape from another version is dropped
// rather than handed to a card that would throw on it
const isSuggestion = (value: unknown): value is Suggestion => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const one = value as Record<string, unknown>;
  const signals = one.signals as Record<string, unknown> | null;
  return (
    typeof one.label === "string" &&
    typeof one.lat === "number" &&
    typeof one.lon === "number" &&
    typeof one.score === "number" &&
    typeof one.spreadKm === "number" &&
    typeof one.offRegion === "boolean" &&
    Array.isArray(one.matches) &&
    !!signals &&
    SIGNAL_FIELDS.every((field) => typeof signals[field] === "number")
  );
};

/**
 * Reads the stored list, dropping whatever is not an entry.
 *
 * An unreadable value, or a shape from another version, resolves to an empty
 * list: a memory that is wrong is worse than one that is short, and the page
 * must open either way.
 */
export const readRecent = (raw: string | null): RecentGeocode[] => {
  if (!raw) {
    return [];
  }
  let stored: unknown;
  try {
    stored = JSON.parse(raw);
  } catch {
    return [];
  }
  return Array.isArray(stored)
    ? stored
        .filter(isEntry)
        .map((entry) =>
          isSuggestion(entry.suggestion) ? entry : { ...entry, suggestion: undefined },
        )
        .slice(0, RECENT_LIMIT)
    : [];
};

export const loadRecent = (): RecentGeocode[] => {
  try {
    return readRecent(window.localStorage.getItem(RECENT_KEY));
  } catch {
    return [];
  }
};

export const saveRecent = (list: RecentGeocode[]): void => {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // storage denied or full: the list is still shown for this visit
  }
};

/** How long ago, in the coarsest unit that is still true. */
export const agoLabel = (at: number, now: number): string => {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 10) {
    return "just now";
  }
  if (seconds < 60) {
    return `${seconds} s ago`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
};
