import { EventType } from "@shared/types/stats";

/** Event types excluded from the Entities tab filter UI (still valid in API/audit). */
export const HIDDEN_EVENT_TYPES: EventType[] = [EventType.DELETE, EventType.ANCHOR_DELETE];

export const VISIBLE_EVENT_TYPES = Object.values(EventType).filter(
  (type) => !HIDDEN_EVENT_TYPES.includes(type)
);

export const OTHERS_KEY = "others";
export const TABLE_PADDING = 30;
export const USER_THRESHOLD_MAX = 20;
export const STATS_FILTER_DEBOUNCE_MS = 1200;

export type TimeKey = string;
export type UserId = string;
export type ValuesMap = Record<TimeKey, Record<UserId, number>>;
