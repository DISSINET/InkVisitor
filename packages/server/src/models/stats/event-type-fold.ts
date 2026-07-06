import { EventType } from "@inkvisitor/shared/types/stats";

/**
 * Deletion event types are folded into their matching edit type for stats, so a
 * deletion counts as an edit (contribution) rather than its own category:
 *   DELETE          -> EDIT
 *   ANCHOR_DELETE   -> ANCHOR_EDIT
 *   RELATION_DELETE -> RELATION_EDIT
 */
const STATS_FOLD_MAP: Partial<Record<EventType, EventType>> = {
  [EventType.DELETE]: EventType.EDIT,
  [EventType.ANCHOR_DELETE]: EventType.ANCHOR_EDIT,
  [EventType.RELATION_DELETE]: EventType.RELATION_EDIT,
};

/** Maps a single event type to the type it is counted as in stats. */
export function foldEventTypeForStats(type: EventType): EventType {
  return STATS_FOLD_MAP[type] ?? type;
}

/**
 * Expands a requested event-type filter so the raw deletion rows that fold into
 * a requested edit type are still fetched from the DB. Requesting EDIT also
 * pulls DELETE; requesting ANCHOR_EDIT also pulls ANCHOR_DELETE. Without this,
 * the delete rows would be filtered out before they could be folded.
 */
export function expandEventTypesForStats(types: EventType[]): EventType[] {
  const expanded = new Set<EventType>(types);
  for (const [deletionType, editType] of Object.entries(STATS_FOLD_MAP) as [
    EventType,
    EventType
  ][]) {
    if (expanded.has(editType)) {
      expanded.add(deletionType);
    }
  }
  return Array.from(expanded);
}

/**
 * Folds a stats values map (timeBucket -> aggregationKey -> count) by merging
 * deletion-type counts into their edit type and summing. Non-event-type keys
 * (e.g. user ids in USER aggregation) pass through unchanged.
 */
export function foldStatsValuesByEventType(
  values: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const [bucket, counts] of Object.entries(values)) {
    const foldedCounts: Record<string, number> = {};
    for (const [key, count] of Object.entries(counts)) {
      const foldedKey = foldEventTypeForStats(key as EventType);
      foldedCounts[foldedKey] = (foldedCounts[foldedKey] ?? 0) + count;
    }
    result[bucket] = foldedCounts;
  }
  return result;
}
