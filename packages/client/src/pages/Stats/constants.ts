import { EventType } from "@inkvisitor/shared/types/stats";

/** Relation audit event types. */
export const RELATION_EVENT_TYPES: EventType[] = [
  EventType.RELATION_CREATE,
  EventType.RELATION_EDIT,
  EventType.RELATION_DELETE,
];

/** Event types hidden from stats UI and document audit table rows (deletions fold into their edit type). */
export const HIDDEN_EVENT_TYPES: EventType[] = [
  EventType.DELETE,
  EventType.ANCHOR_DELETE,
  EventType.RELATION_DELETE,
];

/** Anchor diff sections hidden in DocumentTable (paired with anchor_delete). */
export const HIDDEN_DOCUMENT_CHANGE_SECTIONS = ["removals"] as const;

/** Entity/document/relation activity types selectable on the Entities tab. */
export const VISIBLE_EVENT_TYPES = Object.values(EventType).filter(
  (type) => !HIDDEN_EVENT_TYPES.includes(type)
);

export const OTHERS_KEY = "others";
export const USER_THRESHOLD_MAX = 20;
export const STATS_FILTER_DEBOUNCE_MS = 800;

export type TimeKey = string;
export type UserId = string;
export type ValuesMap = Record<TimeKey, Record<UserId, number>>;
