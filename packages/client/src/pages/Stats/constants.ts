import { Aggregation, EventType } from "@inkvisitor/shared/types/stats";

/** Display labels for the Aggregate By switch. */
export const AGGREGATION_LABELS: Record<Aggregation, string> = {
  [Aggregation.USER]: "user",
  [Aggregation.ACTIVITY_TYPE]: "activity type",
};

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

export interface EventTypeSubgroup {
  /** Optional clickable "label:" prefix that toggles all types of the subgroup. */
  label?: string;
  types: { type: EventType; label: string }[];
}
export interface EventTypeGroup {
  label: string;
  subgroups: EventTypeSubgroup[];
}

/**
 * Event type filter groups for the Entities tab. Chip labels are short because
 * the group label provides the context (e.g. "create" under "relation" means
 * relation_create).
 */
export const EVENT_TYPE_GROUPS: EventTypeGroup[] = [
  {
    label: "entity",
    subgroups: [
      {
        types: [
          { type: EventType.CREATE, label: "create" },
          { type: EventType.EDIT, label: "edit" },
        ],
      },
    ],
  },
  {
    label: "relation",
    subgroups: [
      {
        types: [
          { type: EventType.RELATION_CREATE, label: "create" },
          { type: EventType.RELATION_EDIT, label: "edit" },
        ],
      },
    ],
  },
  {
    label: "document",
    subgroups: [
      {
        label: "text",
        types: [{ type: EventType.TEXT_EDIT, label: "edit" }],
      },
      {
        label: "anchor",
        types: [
          { type: EventType.ANCHOR_ADD, label: "add" },
          { type: EventType.ANCHOR_EDIT, label: "edit" },
        ],
      },
    ],
  },
];

export const OTHERS_KEY = "others";
export const USER_THRESHOLD_MAX = 20;
export const STATS_FILTER_DEBOUNCE_MS = 800;

export type TimeKey = string;
export type UserId = string;
export type ValuesMap = Record<TimeKey, Record<UserId, number>>;
