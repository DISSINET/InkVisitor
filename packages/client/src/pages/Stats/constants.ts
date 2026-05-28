import { EventType } from "@inkvisitor/shared/types/stats";

/** Event types hidden from stats UI and document audit table rows. */
export const HIDDEN_EVENT_TYPES: EventType[] = [EventType.DELETE, EventType.ANCHOR_DELETE];

/** Anchor diff sections hidden in DocumentTable (paired with anchor_delete). */
export const HIDDEN_DOCUMENT_CHANGE_SECTIONS = ["removals"] as const;

export const VISIBLE_EVENT_TYPES = Object.values(EventType).filter(
  (type) => !HIDDEN_EVENT_TYPES.includes(type)
);

export const OTHERS_KEY = "others";
export const TABLE_PADDING = 30;
export const USER_THRESHOLD_MAX = 20;
export const STATS_FILTER_DEBOUNCE_MS = 800;

export type TimeKey = string;
export type UserId = string;
export type ValuesMap = Record<TimeKey, Record<UserId, number>>;
